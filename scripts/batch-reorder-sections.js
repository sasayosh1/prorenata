require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const { createBackup } = require('./backup-utility')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function reorderArticleSections(article) {
    const body = article.body || []
    if (body.length === 0) return null

    // Helper to find section start index
    const findSectionStart = (keyword, level = ['h2', 'h3']) => {
        return body.findIndex(b =>
            level.includes(b.style) && b.children?.[0]?.text?.includes(keyword)
        )
    }

    // Find Disclaimer (special case, might not be a heading)
    const findDisclaimerStart = () => {
        return body.findIndex(b => JSON.stringify(b).includes('免責事項'))
    }

    const refIndex = findSectionStart('参考文献')
    const summaryIndex = findSectionStart('まとめ', ['h2'])
    const relatedIndex = findSectionStart('あわせて読みたい')
    const disclaimerIndex = findDisclaimerStart()

    // If critical sections are missing, skip reordering (except for simple swaps)
    if (summaryIndex === -1) {
        console.log(`⚠️ Skipping ${article.title}: Missing summary section`)
        return null
    }

    // Extract sections
    const extractSection = (startIndex, nextIndices) => {
        if (startIndex === -1) return []

        // Find the end of this section (start of next known section or end of body)
        const validNextIndices = nextIndices.filter(i => i !== -1 && i > startIndex).sort((a, b) => a - b)
        const endIndex = validNextIndices.length > 0 ? validNextIndices[0] : body.length

        return body.slice(startIndex, endIndex)
    }

    // Identify all start indices
    const indices = [refIndex, summaryIndex, relatedIndex, disclaimerIndex].filter(i => i !== -1).sort((a, b) => a - b)

    // If no sections found (unlikely if summary exists), return
    if (indices.length === 0) return null

    // Content is everything before the first special section
    const content = body.slice(0, indices[0])

    const referenceSection = extractSection(refIndex, [summaryIndex, relatedIndex, disclaimerIndex])
    const summarySection = extractSection(summaryIndex, [relatedIndex, disclaimerIndex]) // Reference is usually before summary
    const relatedSection = extractSection(relatedIndex, [disclaimerIndex]) // Summary is usually before related
    const disclaimerSection = extractSection(disclaimerIndex, []) // Last section

    // Construct new body
    // New Order: Content -> Summary -> Related -> Reference -> Disclaimer
    const newBody = [
        ...content,
        ...summarySection,
        ...relatedSection,
        ...referenceSection,
        ...disclaimerSection
    ]

    // Check if order actually changed
    if (JSON.stringify(newBody) === JSON.stringify(body)) {
        return null
    }

    return newBody
}

async function main() {
    const slug = process.argv[2];
    let query = `*[_type == "post"]`;
    if (slug) {
        query = `*[_type == "post" && slug.current == "${slug}"]`;
    }
    query += `{ _id, title, body }`;

    console.log('🚀 Starting Batch Section Reordering...\n');

    const articles = await client.fetch(query);

    if (articles.length === 0) {
        console.log('No articles found for the given slug.');
        return;
    }

    console.log(`📊 Found ${articles.length} articles. Processing...\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const article of articles) {
        try {
            const newBody = await reorderArticleSections(article);

            if (newBody) {
                console.log(`🔄 Reordering sections for: ${article.title}`);
                await createBackup(article._id, 'reorder-sections');

                await client
                    .patch(article._id)
                    .set({ body: newBody })
                    .commit();

                console.log('   ✅ Updated');
                updatedCount++;
            } else {
                console.log(`No changes needed for: ${article.title}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${article.title}:`, error.message);
            errorCount++;
        }
    }

    console.log('\n============================================================');
    console.log(`✅ Completed! Updated: ${updatedCount}, Errors: ${errorCount}`);
    console.log('============================================================');
}

main().catch(console.error)

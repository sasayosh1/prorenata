require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function removeSummaryByContent(slug, targetHeadingText) {
    if (!slug || !targetHeadingText) {
        console.error('Error: Slug and targetHeadingText are required.');
        process.exit(1);
    }

    try {
        const article = await client.fetch(
            `*[_type == "post" && slug.current == $slug][0] { _id, body, title }`,
            { slug }
        );

        if (!article || !article.body) {
            console.log('Article not found or body is empty.');
            return;
        }

        let newBody = [...article.body];
        let headingIndex = -1;

        // Find the index of the target heading using partial match
        for (let i = 0; i < newBody.length; i++) {
            const block = newBody[i];
            if (block._type === 'block' && block.style === 'h2' && block.children && block.children[0]?.text?.includes(targetHeadingText)) {
                headingIndex = i;
                break;
            }
        }

        if (headingIndex !== -1) {
            // Determine the end of the section to be removed
            let endIndex = headingIndex + 1;
            while (endIndex < newBody.length) {
                const currentBlock = newBody[endIndex];
                // Stop if it's another H2, but not the summary we intend to keep
                if (currentBlock._type === 'block' && currentBlock.style === 'h2' && currentBlock.children && currentBlock.children[0]?.text?.includes('まとめ：小さな“きれい”が心をあたためる')) {
                    break;
                }
                 if (currentBlock._type === 'block' && currentBlock.style === 'h2' && currentBlock.children && !currentBlock.children[0]?.text?.includes(targetHeadingText)){
                    break;
                }
                endIndex++;
            }

            const removedBlocks = newBody.splice(headingIndex, endIndex - headingIndex);
            console.log(`Removed ${removedBlocks.length} blocks for section "${targetHeadingText}" from ${article.title}.`);

            await client
                .patch(article._id)
                .set({ body: newBody })
                .commit();
            console.log(`Article updated successfully after removing section.`);
        } else {
            console.log(`Section with heading "${targetHeadingText}" not found in ${article.title}. No changes made.`);
        }

    } catch (error) {
        console.error('Error removing section by content:', error);
    }
}

const slug = process.argv[2];
const targetHeadingText = process.argv[3];
removeSummaryByContent(slug, targetHeadingText);

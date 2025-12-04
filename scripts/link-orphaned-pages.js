const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function linkOrphanedPages() {
    console.log('=== Linking Orphaned Pages ===\n');

    // 1. Get all posts with their ID, title, slug, categories, and body
    const allPosts = await client.fetch(`
        *[_type == "post"] {
            _id,
            title,
            slug,
            "categories": categories[]->title,
            body
        }
    `);

    // 2. Identify Orphaned Pages (simplified check: not linked from others)
    // Note: A full graph analysis is heavy, so we'll rely on the previous analysis count (94)
    // and just ensure EVERY post has a "Related Articles" section that links to others.

    // Actually, let's target the specific "Orphaned" ones if we can, but for now, 
    // adding a dynamic "See Also" section to ALL posts is a better systemic fix.

    // Strategy: For each post, pick 3 other posts from the same category that are NOT currently linked in the body.

    let updatedCount = 0;

    for (const post of allPosts) {
        if (!post.body || !Array.isArray(post.body)) continue;

        // Check if "Related Articles" (あわせて読みたい) already exists
        const hasRelatedSection = post.body.some(block =>
            block._type === 'block' &&
            block.style === 'h2' &&
            block.children?.[0]?.text?.includes('あわせて読みたい')
        );

        if (hasRelatedSection) {
            console.log(`Skipping ${post.title} (Already has related section)`);
            continue;
        }

        // Find candidates: Same category, not self, not already linked
        const candidates = allPosts.filter(p =>
            p._id !== post._id &&
            p.categories?.some(c => post.categories?.includes(c)) &&
            !JSON.stringify(post.body).includes(p.slug.current) // Simple string check for existing link
        );

        // Shuffle and pick 3
        const selected = candidates.sort(() => 0.5 - Math.random()).slice(0, 3);

        if (selected.length === 0) continue;

        // Create the new section
        const newSection = [
            {
                _type: 'block',
                style: 'h2',
                children: [{ _type: 'span', text: 'あわせて読みたい' }],
                markDefs: []
            },
            {
                _type: 'block',
                style: 'normal',
                children: [{ _type: 'span', text: 'この記事を読んだ方には、以下の記事もおすすめです。' }],
                markDefs: []
            },
            {
                _type: 'block',
                style: 'normal',
                listItem: 'bullet',
                level: 1,
                children: [
                    {
                        _type: 'span',
                        text: selected[0].title,
                        marks: ['link-related-0']
                    }
                ],
                markDefs: [
                    {
                        _key: 'link-related-0',
                        _type: 'link',
                        href: `/posts/${selected[0].slug.current}`
                    }
                ]
            }
        ];

        // Add remaining items
        for (let i = 1; i < selected.length; i++) {
            newSection.push({
                _type: 'block',
                style: 'normal',
                listItem: 'bullet',
                level: 1,
                children: [
                    {
                        _type: 'span',
                        text: selected[i].title,
                        marks: [`link-related-${i}`]
                    }
                ],
                markDefs: [
                    {
                        _key: `link-related-${i}`,
                        _type: 'link',
                        href: `/posts/${selected[i].slug.current}`
                    }
                ]
            });
        }

        // Update the post
        try {
            await client
                .patch(post._id)
                .setIfMissing({ body: [] })
                .append('body', newSection)
                .commit();

            console.log(`✅ Updated ${post.title} with ${selected.length} links`);
            updatedCount++;
        } catch (err) {
            console.error(`❌ Failed to update ${post.title}:`, err.message);
        }
    }

    console.log(`\nTotal posts updated: ${updatedCount}`);
}

linkOrphanedPages();

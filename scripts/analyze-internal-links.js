const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function analyzeInternalLinks() {
    // Fetch all posts with their slugs and body content
    const query = `*[_type == "post"] {
        title,
        "slug": slug.current,
        body
    }`;
    const posts = await client.fetch(query);

    const linkMap = {}; // slug -> { incoming: [], outgoing: [] }
    const slugToTitle = {};

    // Initialize map
    posts.forEach(post => {
        if (post.slug) {
            linkMap[post.slug] = { incoming: [], outgoing: [] };
            slugToTitle[post.slug] = post.title;
        }
    });

    // Analyze links
    posts.forEach(sourcePost => {
        if (!sourcePost.body || !sourcePost.slug) return;

        const findLinks = (blocks) => {
            if (!Array.isArray(blocks)) return;
            blocks.forEach(block => {
                if (block.markDefs) {
                    block.markDefs.forEach(def => {
                        if (def._type === 'link' && def.href && def.href.startsWith('/posts/')) {
                            const targetSlug = def.href.replace('/posts/', '');
                            if (linkMap[targetSlug]) {
                                linkMap[sourcePost.slug].outgoing.push(targetSlug);
                                linkMap[targetSlug].incoming.push(sourcePost.slug);
                            }
                        }
                    });
                }
                if (block.children) {
                    findLinks(block.children);
                }
            });
        };

        findLinks(sourcePost.body);
    });

    // Report
    console.log('=== Internal Link Analysis ===\n');

    console.log('--- Orphaned Articles (0 Incoming Links) ---');
    let orphanedCount = 0;
    for (const slug in linkMap) {
        if (linkMap[slug].incoming.length === 0) {
            console.log(`- ${slugToTitle[slug]} (${slug})`);
            orphanedCount++;
        }
    }
    console.log(`Total Orphaned: ${orphanedCount}\n`);

    console.log('--- Top Linked Articles (Most Incoming Links) ---');
    const sortedByIncoming = Object.entries(linkMap).sort((a, b) => b[1].incoming.length - a[1].incoming.length);
    sortedByIncoming.slice(0, 10).forEach(([slug, data]) => {
        console.log(`- ${slugToTitle[slug]}: ${data.incoming.length} links`);
    });

}

analyzeInternalLinks();

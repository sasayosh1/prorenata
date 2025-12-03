const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

async function removeSelfReferenceLinks() {
    console.log('=== Removing Self-Reference Links ===\n');

    // Get all posts
    const allPosts = await client.fetch(`*[_type == "post"] { 
        _id, 
        title, 
        "slug": slug.current,
        body 
    }`);

    console.log(`Total articles: ${allPosts.length}\n`);

    let fixedCount = 0;

    for (const post of allPosts) {
        let modified = false;
        const newBody = [];

        for (const block of post.body) {
            // Check if block has markDefs (links)
            if (block.markDefs && block.markDefs.length > 0) {
                // Filter out self-reference links
                const cleanedMarkDefs = block.markDefs.filter(def => {
                    if (def._type === 'link' && def.href) {
                        // Check if link points to current article
                        if (def.href.includes(post.slug)) {
                            console.log(`  Found self-reference in ${post.slug}: ${def.href}`);
                            modified = true;
                            return false; // Remove this markDef
                        }
                    }
                    return true; // Keep this markDef
                });

                // If we removed any markDefs, update the block
                if (cleanedMarkDefs.length !== block.markDefs.length) {
                    // Also need to remove the marks from children
                    const removedKeys = block.markDefs
                        .filter(def => !cleanedMarkDefs.includes(def))
                        .map(def => def._key);

                    const cleanedChildren = block.children.map(child => {
                        if (child.marks && child.marks.length > 0) {
                            const cleanedMarks = child.marks.filter(mark => !removedKeys.includes(mark));
                            return { ...child, marks: cleanedMarks };
                        }
                        return child;
                    });

                    newBody.push({
                        ...block,
                        markDefs: cleanedMarkDefs,
                        children: cleanedChildren
                    });
                } else {
                    newBody.push(block);
                }
            } else {
                newBody.push(block);
            }
        }

        if (modified) {
            console.log(`\n📝 ${post.title}`);
            console.log(`   Slug: ${post.slug}`);

            try {
                await client.patch(post._id)
                    .set({ body: newBody })
                    .commit();
                console.log(`   ✅ Fixed`);
                fixedCount++;
            } catch (err) {
                console.error(`   ❌ Error: ${err.message}`);
            }
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Fixed articles: ${fixedCount}`);
    console.log('Done.');
}

removeSelfReferenceLinks();

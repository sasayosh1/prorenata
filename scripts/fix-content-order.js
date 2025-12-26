const { createClient } = require('@sanity/client');

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!token) {
    console.error('Error: SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required.');
    process.exit(1);
}

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
});

async function fixContentOrder() {
    console.log('=== Fixing Content Order (Moving content before Matome) ===\n');

    // List of slugs touched in previous steps
    const targetSlugs = [
        'comparison-of-three-resignation-agencies',            // Killer Page 1
        'nursing-assistant-compare-services-perspective',       // Killer Page 2
        'nursing-assistant-resignation-advice-insights',        // Source 1
        'nursing-assistant-latest-salary-comparison',           // Source 2
        'nursing-assistant-night-shift-journey'                 // Source 3
    ];

    for (const slug of targetSlugs) {
        const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug });
        if (!post || !post.body) continue;

        console.log(`Checking: ${post.title}`);

        const body = post.body;
        let matomeIndex = -1;

        // Find "Matome" or similar closing H2
        // We look for the LAST H2 that looks like a summary
        for (let i = body.length - 1; i >= 0; i--) {
            const block = body[i];
            if (block.style === 'h2') {
                const text = block.children?.map(c => c.text).join('') || '';
                if (text.includes('まとめ') || text.includes('最後に') || text.includes('おわりに')) {
                    matomeIndex = i;
                    console.log(`  Found Matome at index ${i}: "${text}"`);
                    break;
                }
            }
        }

        if (matomeIndex === -1) {
            console.log('  ⚠️ No explicit Matome H2 found. Skipping.');
            continue;
        }

        // Check if there is content AFTER Matome (except "Awasete Yomitai" or Disclaimer)
        // Actually, logic is simple: Everything designated as "Main Body Content" should be BEFORE Matome.
        // We will move any H2, H3, P blocks found AFTER Matome to BEFORE Matome.
        // EXCEPT: "Related Articles" (Awasete Yomitai) and Disclaimer.

        const beforeMatome = [];
        const matomeAndAfter = [];
        const contentToMove = [];

        // Split content
        for (let i = 0; i < body.length; i++) {
            if (i < matomeIndex) {
                beforeMatome.push(body[i]);
            } else if (i === matomeIndex) {
                matomeAndAfter.push(body[i]); // The Matome H2 itself
            } else {
                // Content AFTER Matome
                const block = body[i];
                const text = block.children?.map(c => c.text).join('') || '';

                // Rules for what STAYS at the bottom:
                // 1. "Related Articles" / "Awasete Yomitai" (Heading or specific component if exists)
                // 2. Disclaimer (Often block containing "免責事項")
                // 3. Recommended Links (often H3 after Matome)

                const isRelated = text.includes('あわせて読みたい') || text.includes('関連記事');
                const isDisclaimer = text.includes('免責事項');

                // If it's the specific content we added (FAQ, Voices, Comparison, CTA), move it UP.
                // We identify our added content by H2/H3 or specific keywords, or simply:
                // "If it's NOT Related/Disclaimer, move it UP".
                // However, Matome content itself (paragraphs inside Matome) must stay.

                // Heuristic: If we hit another H2 after Matome, that H2 and its following content 
                // is likely what we misplaced (e.g., "FAQ", "Values") UNLESS it is "Related Articles".

                if (block.style === 'h2' && !isRelated) {
                    // This is likely a misplaced section header (e.g. FAQ)
                    // We will assume this and all following blocks until next boundary are to be moved.
                    contentToMove.push(block);
                } else if (contentToMove.length > 0 && !isRelated && !isDisclaimer) {
                    // If we are currently moving a section, keep adding to it
                    contentToMove.push(block);
                } else {
                    // Otherwise it belongs in the footer (Matome content, Related, Disclaimer)
                    // BUT wait, paragraphs belonging to Matome H2?
                    // We need to distinguish "Matome's body text" vs "Misplaced New Section".

                    // IF we are capturing misplaced content, add to list.
                    // ELSE add to matomeAndAfter.
                    // The problem is distinguishing Matome's paragraphs from misplaced paragraphs if headers are missing.
                    // But our script inserted H2s ("FAQ", "Voices"). So we look for those.

                    if (contentToMove.length > 0) {
                        // We are in "move mode" but hit a footer-allowed item?
                        // If we hit Related/Disclaimer, we stop moving? 
                        // No, those are at the very end. 
                        if (isRelated || isDisclaimer) {
                            matomeAndAfter.push(block);
                        } else {
                            contentToMove.push(block);
                        }
                    } else {
                        // We haven't started a move sequence.
                        // Is this block part of Matome?
                        // Generally yes, unless it's a new H2.
                        matomeAndAfter.push(block);
                    }
                }
            }
        }

        if (contentToMove.length > 0) {
            console.log(`  🔄 Moving ${contentToMove.length} blocks to before Matome...`);
            // verify what we match
            // contentToMove.forEach(b => console.log(`    - ${b.style||'p'}: ${(b.children||[])[0]?.text?.substring(0,20)}...`));

            const newBody = [...beforeMatome, ...contentToMove, ...matomeAndAfter];

            await client.patch(post._id).set({
                body: newBody,
                autoEditLock: true // Ensure lock is kept
            }).commit();

            console.log('  ✅ Fixed.');
        } else {
            console.log('  ✨ Seems correct (no misplaced sections detected).');
        }
        console.log('---');
    }
}

fixContentOrder().catch(console.error);

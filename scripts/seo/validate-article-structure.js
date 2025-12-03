const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

/**
 * Validates article structure according to RULES.md
 * 
 * Rules:
 * 1. まとめ → アフィリエイトカード → 免責事項 → その他ナビ の順序
 * 2. 免責事項の後にコンテンツがあってはいけない
 * 3. 自己参照リンク禁止
 */

async function validateArticle(slug) {
    const query = `*[_type == "post" && slug.current == "${slug}"][0] { 
        _id, 
        title, 
        slug,
        body 
    }`;

    const post = await client.fetch(query);
    if (!post) return null;

    const issues = [];

    // Find disclaimer (免責事項)
    const disclaimerIndex = post.body.findIndex(block =>
        block._type === 'block' &&
        block.children &&
        block.children.some(child =>
            child.text && (
                child.text.includes('参考資料・厚生労働省 職業情報提供サイト') ||
                child.text.includes('免責事項')
            )
        )
    );

    if (disclaimerIndex !== -1) {
        // Check for content after disclaimer
        const afterDisclaimer = post.body.slice(disclaimerIndex + 1);
        const substantiveContent = afterDisclaimer.filter(block => {
            if (block._type !== 'block') return false;
            if (!block.children) return false;

            const text = block.children.map(c => c.text || '').join('').trim();

            // Ignore empty blocks or navigation blocks
            if (!text) return false;
            if (text.includes('関連記事') || text.includes('次の記事')) return false;

            return true;
        });

        if (substantiveContent.length > 0) {
            issues.push({
                type: 'content_after_disclaimer',
                message: `免責事項の後に${substantiveContent.length}個のコンテンツブロックがあります`,
                blocks: substantiveContent.slice(0, 2).map(b =>
                    b.children.map(c => c.text || '').join('').substring(0, 50)
                )
            });
        }
    }

    // Check for self-referencing links
    const selfLinks = [];
    post.body.forEach((block, idx) => {
        if (block.markDefs) {
            block.markDefs.forEach(def => {
                if (def._type === 'link' && def.href) {
                    if (def.href.includes(post.slug.current)) {
                        selfLinks.push({
                            index: idx,
                            href: def.href
                        });
                    }
                }
            });
        }
    });

    if (selfLinks.length > 0) {
        issues.push({
            type: 'self_reference',
            message: `自己参照リンクが${selfLinks.length}個あります`,
            links: selfLinks
        });
    }

    return {
        slug: post.slug.current,
        title: post.title,
        issues
    };
}

async function main() {
    console.log('=== Article Structure Validation ===\n');

    // Get all posts
    const allPosts = await client.fetch(`*[_type == "post"] { "slug": slug.current }`);
    console.log(`Total articles: ${allPosts.length}\n`);

    const violations = [];

    for (const post of allPosts) {
        const result = await validateArticle(post.slug);
        if (result && result.issues.length > 0) {
            violations.push(result);
        }
    }

    if (violations.length === 0) {
        console.log('✅ No violations found!');
    } else {
        console.log(`⚠️  Found ${violations.length} articles with violations:\n`);

        violations.forEach(v => {
            console.log(`\n📄 ${v.title}`);
            console.log(`   Slug: ${v.slug}`);
            v.issues.forEach(issue => {
                console.log(`   ❌ ${issue.type}: ${issue.message}`);
                if (issue.blocks) {
                    issue.blocks.forEach(b => console.log(`      - "${b}..."`));
                }
                if (issue.links) {
                    issue.links.forEach(l => console.log(`      - ${l.href}`));
                }
            });
        });
    }

    console.log('\n=== Done ===');
}

main();

const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
});

// High-value affiliate patterns (転職・退職)
const HIGH_VALUE_AFFILIATES = [
    { name: '退職代行 即ヤメ', pattern: /a_id=5211257/ },
    { name: '弁護士法人ガイア', pattern: /a_id=5211256/ },
    { name: 'リニューケア', pattern: /a_id=5207862/ },
    { name: 'かいご畑', pattern: /a8mat=2ZTT9A\+D2Y8MQ/ },
];

// Low-value affiliate patterns (物販)
const LOW_VALUE_AFFILIATES = [
    { name: 'Amazon', pattern: /amazon\.co\.jp/ },
    { name: '楽天', pattern: /rakuten\.co\.jp/ },
];

function extractAllLinks(body) {
    const links = [];

    if (!Array.isArray(body)) return links;

    for (const block of body) {
        if (block.markDefs && Array.isArray(block.markDefs)) {
            for (const mark of block.markDefs) {
                if (mark._type === 'link' && mark.href) {
                    links.push(mark.href);
                }
            }
        }
    }

    return links;
}

function categorizeLink(href) {
    // Check high-value affiliates
    for (const affiliate of HIGH_VALUE_AFFILIATES) {
        if (affiliate.pattern.test(href)) {
            return { type: 'high-value', name: affiliate.name };
        }
    }

    // Check low-value affiliates
    for (const affiliate of LOW_VALUE_AFFILIATES) {
        if (affiliate.pattern.test(href)) {
            return { type: 'low-value', name: affiliate.name };
        }
    }

    // Check if internal link
    if (href.startsWith('/') || href.includes('prorenata.jp')) {
        return { type: 'internal', name: 'Internal Link' };
    }

    return { type: 'other', name: 'Other External' };
}

async function analyzeAffiliateDistribution() {
    console.log('=== ProReNata Affiliate Link Analysis ===\n');

    const posts = await client.fetch(`
        *[_type == "post"] | order(views desc) {
            title,
            "slug": slug.current,
            views,
            body
        }
    `);

    console.log(`Total articles: ${posts.length}\n`);

    const killerPages = [];
    const supportPages = [];
    const noAffiliatePages = [];

    for (const post of posts) {
        const links = extractAllLinks(post.body);
        const categorized = links.map(link => categorizeLink(link));

        const highValueLinks = categorized.filter(c => c.type === 'high-value');
        const lowValueLinks = categorized.filter(c => c.type === 'low-value');
        const internalLinks = categorized.filter(c => c.type === 'internal');

        const pageData = {
            title: post.title,
            slug: post.slug,
            views: post.views || 0,
            highValueCount: highValueLinks.length,
            lowValueCount: lowValueLinks.length,
            internalCount: internalLinks.length,
            highValueNames: [...new Set(highValueLinks.map(l => l.name))],
        };

        if (highValueLinks.length > 0) {
            killerPages.push(pageData);
        } else if (lowValueLinks.length > 0 || internalLinks.length > 0) {
            supportPages.push(pageData);
        } else {
            noAffiliatePages.push(pageData);
        }
    }

    // Report
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 KILLER PAGES (高報酬アフィリエイトあり)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    killerPages.forEach((page, index) => {
        console.log(`${index + 1}. ${page.title}`);
        console.log(`   Slug: ${page.slug}`);
        console.log(`   Views: ${page.views}`);
        console.log(`   High-Value Links: ${page.highValueCount} (${page.highValueNames.join(', ')})`);
        console.log(`   Internal Links: ${page.internalCount}`);
        console.log('');
    });

    console.log(`\nTotal Killer Pages: ${killerPages.length}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📄 SUPPORT PAGES (物販/内部リンクのみ)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Show top 10 support pages by views
    supportPages.sort((a, b) => b.views - a.views);
    supportPages.slice(0, 10).forEach((page, index) => {
        console.log(`${index + 1}. ${page.title} (${page.views} views)`);
        console.log(`   Slug: ${page.slug}`);
        console.log(`   Low-Value: ${page.lowValueCount}, Internal: ${page.internalCount}`);
        console.log('');
    });

    console.log(`\nTotal Support Pages: ${supportPages.length}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  NO AFFILIATE PAGES (アフィリエイトなし)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Total: ${noAffiliatePages.length} pages\n`);

    // Top pages without affiliates (opportunity!)
    noAffiliatePages.sort((a, b) => b.views - a.views);
    const topNoAffiliate = noAffiliatePages.slice(0, 10);

    console.log('Top 10 high-traffic pages without affiliates (収益化機会):\n');
    topNoAffiliate.forEach((page, index) => {
        console.log(`${index + 1}. ${page.title} (${page.views} views)`);
        console.log(`   Slug: ${page.slug}`);
        console.log('');
    });

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📈 SUMMARY\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total Articles: ${posts.length}`);
    console.log(`Killer Pages: ${killerPages.length} (${((killerPages.length / posts.length) * 100).toFixed(1)}%)`);
    console.log(`Support Pages: ${supportPages.length} (${((supportPages.length / posts.length) * 100).toFixed(1)}%)`);
    console.log(`No Affiliate: ${noAffiliatePages.length} (${((noAffiliatePages.length / posts.length) * 100).toFixed(1)}%)`);

    // Calculate potential
    const totalViewsKiller = killerPages.reduce((sum, p) => sum + p.views, 0);
    const totalViewsAll = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    console.log(`\nKiller Pages Views: ${totalViewsKiller} (${((totalViewsKiller / totalViewsAll) * 100).toFixed(1)}% of total)`);
    console.log(`\n⚡ Optimization Opportunity: ${topNoAffiliate.length} high-traffic pages could link to killer pages\n`);
}

analyzeAffiliateDistribution().catch(console.error);

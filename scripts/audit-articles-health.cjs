const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
    useCdn: false
});

async function runAudit() {
    console.log("🔍 ProReNata Article Technical Audit Starting...");
    const query = `*[_type == "post" && !(_id in path("drafts.**"))] {
        _id,
        title,
        "slug": slug.current,
        body,
        "links": body[].children[].href
    }`;

    const posts = await client.fetch(query);
    const report = [];

    posts.forEach(post => {
        const text = extractText(post.body);
        const wordCount = text.length;
        const links = (post.links || []).filter(Boolean);
        const totalLinks = links.length;
        const affiliateLinks = links.filter(href => /moshimo|a8\.net|valuecommerce|amazon|rakuten/i.test(href)).length;

        const issues = [];
        if (wordCount < 1000) issues.push("⚠️ Content is thin (<1000 chars)");
        if (totalLinks > 15) issues.push("🛑 Excessive links (>15)");
        if (totalLinks === 0) issues.push("📢 No links found");
        if (affiliateLinks > 5) issues.push("💰 High affiliate density (>5)");

        // Contextual analysis (simple keywords)
        if (text.includes("がんばる")) issues.push("👤 Tone warning: 'がんばる' used (forbidden in Sera persona)");

        report.push({
            title: post.title,
            slug: post.slug,
            wordCount,
            linkCount: totalLinks,
            affiliateCount: affiliateLinks,
            issues
        });
    });

    // Sort by most issues
    report.sort((a, b) => b.issues.length - a.issues.length);

    let output = "# ProReNata Article Health Audit Report\n\n";
    output += `Total Articles Audited: ${report.length}\n\n`;

    report.forEach(r => {
        if (r.issues.length > 0) {
            output += `### [${r.title}](https://prorenata.jp/posts/${r.slug})\n`;
            output += `- **Issues**: ${r.issues.join(', ')}\n`;
            output += `- **Metrics**: ${r.wordCount} chars, ${r.linkCount} links (${r.affiliateCount} affiliate)\n\n`;
        }
    });

    const reportPath = path.join(process.cwd(), 'audit_report.md');
    fs.writeFileSync(reportPath, output);
    console.log(`✅ Audit complete. Report saved to: ${reportPath}`);
}

function extractText(body) {
    if (!body || !Array.isArray(body)) return '';
    return body
        .filter(b => b._type === 'block')
        .map(b => (b.children || []).map(c => c.text).join(''))
        .join('\n');
}

runAudit().catch(console.error);

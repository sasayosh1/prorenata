require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const https = require('https')
const http = require('http')
const { URL } = require('url')
const fs = require('fs')
const path = require('path')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const USER_AGENT = 'Mozilla/5.0 (compatible; ProReNataBot/1.0; +https://prorenata.jp)';
const REPORT_DIR = path.join(__dirname, '../reports');
const REPORT_FILE = path.join(REPORT_DIR, `broken_links_${new Date().toISOString().split('T')[0]}.md`);

function checkUrl(url) {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;

            const options = {
                method: 'HEAD',
                headers: { 'User-Agent': USER_AGENT },
                timeout: 10000
            };

            const req = protocol.request(url, options, (res) => {
                if (res.statusCode === 405) {
                    // Try GET if HEAD is not allowed
                    const getReq = protocol.request(url, { ...options, method: 'GET' }, (getRes) => {
                        resolve({ url, status: getRes.statusCode, ok: getRes.statusCode >= 200 && getRes.statusCode < 400 });
                    });
                    getReq.on('error', (err) => resolve({ url, status: 'ERROR', ok: false, error: err.message }));
                    getReq.on('timeout', () => { getReq.destroy(); resolve({ url, status: 'TIMEOUT', ok: false }); });
                    getReq.end();
                } else {
                    resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
                }
            });

            req.on('error', (err) => {
                resolve({ url, status: 'ERROR', ok: false, error: err.message });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ url, status: 'TIMEOUT', ok: false });
            });

            req.end();
        } catch (e) {
            resolve({ url, status: 'INVALID', ok: false, error: e.message });
        }
    });
}

async function main() {
    console.log('🔍 Starting comprehensive broken link check...\n');
    console.log(`Report will be saved to: ${REPORT_FILE}\n`);

    // Ensure reports directory exists
    if (!fs.existsSync(REPORT_DIR)) {
        fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    const posts = await client.fetch(`*[_type == "post" && !(_id in path("drafts.**"))] {
        title,
        "slug": slug.current,
        body
    }`);

    console.log(`Checking ${posts.length} articles...\n`);

    let totalLinks = 0;
    let brokenLinks = [];
    let checkedUrls = new Set();

    for (const post of posts) {
        if (!post.body || !Array.isArray(post.body)) continue;

        process.stdout.write(`Checking: ${post.title.substring(0, 40)}... `);

        let postBrokenCount = 0;

        for (const block of post.body) {
            if (block.markDefs && Array.isArray(block.markDefs)) {
                for (const def of block.markDefs) {
                    if (def._type === 'link' && def.href && (def.href.startsWith('http://') || def.href.startsWith('https://'))) {
                        // Skip if already checked
                        if (checkedUrls.has(def.href)) continue;
                        checkedUrls.add(def.href);

                        totalLinks++;
                        const result = await checkUrl(def.href);

                        if (!result.ok) {
                            const linkChild = block.children?.find(c => c.marks && c.marks.includes(def._key));
                            const text = linkChild ? linkChild.text : '(no text)';

                            brokenLinks.push({
                                article: post.title,
                                slug: post.slug,
                                url: def.href,
                                text: text,
                                status: result.status,
                                error: result.error
                            });
                            postBrokenCount++;
                        }

                        // Small delay to avoid overwhelming servers
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            }
        }

        console.log(postBrokenCount > 0 ? `❌ ${postBrokenCount} broken` : '✅');
    }

    // Generate report
    let report = `# Broken Links Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Total Articles Checked:** ${posts.length}\n`;
    report += `- **Total Unique Links Checked:** ${totalLinks}\n`;
    report += `- **Broken Links Found:** ${brokenLinks.length}\n\n`;

    if (brokenLinks.length > 0) {
        report += `## Broken Links Details\n\n`;

        // Group by status
        const byStatus = {};
        brokenLinks.forEach(link => {
            if (!byStatus[link.status]) byStatus[link.status] = [];
            byStatus[link.status].push(link);
        });

        for (const [status, links] of Object.entries(byStatus)) {
            report += `### Status: ${status} (${links.length} links)\n\n`;
            links.forEach((link, i) => {
                report += `${i + 1}. **${link.text}**\n`;
                report += `   - URL: ${link.url}\n`;
                report += `   - Article: [${link.article}](https://prorenata.jp/posts/${link.slug})\n`;
                if (link.error) report += `   - Error: ${link.error}\n`;
                report += `\n`;
            });
        }
    } else {
        report += `## ✅ No Broken Links Found!\n\n`;
        report += `All external links are working correctly.\n`;
    }

    // Save report
    fs.writeFileSync(REPORT_FILE, report, 'utf8');

    console.log('\n' + '='.repeat(60));
    console.log('📊 Final Report');
    console.log('='.repeat(60));
    console.log(`Total Links Checked: ${totalLinks}`);
    console.log(`Broken Links: ${brokenLinks.length}`);
    console.log(`Report saved to: ${REPORT_FILE}`);
    console.log('='.repeat(60));
}

main().catch(console.error);

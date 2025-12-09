require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const https = require('https')
const http = require('http')
const { URL } = require('url')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const USER_AGENT = 'Mozilla/5.0 (compatible; ProReNataBot/1.0; +https://prorenata.jp)';

function checkUrl(url) {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;

            const options = {
                method: 'HEAD',
                headers: { 'User-Agent': USER_AGENT },
                timeout: 8000
            };

            const req = protocol.request(url, options, (res) => {
                resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
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
    console.log('🔍 Checking links in articles mentioning "ヒューマンライフケア"...\n');

    const posts = await client.fetch(`*[_type == "post"] {
        title,
        "slug": slug.current,
        body
    }`);

    let brokenLinks = [];
    let checkedCount = 0;

    for (const post of posts) {
        if (!post.body || !Array.isArray(post.body)) continue;

        const bodyString = JSON.stringify(post.body);
        if (!bodyString.includes('ヒューマンライフケア')) continue;

        const linksToCheck = [];

        post.body.forEach(block => {
            if (block.markDefs && Array.isArray(block.markDefs)) {
                block.markDefs.forEach(def => {
                    if (def._type === 'link' && def.href && def.href.startsWith('http')) {
                        // Check if link text or href is relevant, OR just check all external links in these relevant articles
                        // To be safe and thorough for the user's request, let's check ALL external links in these articles
                        // but prioritize/highlight ones that look like the target.

                        const linkChild = block.children.find(c => c.marks && c.marks.includes(def._key));
                        const text = linkChild ? linkChild.text : '';

                        linksToCheck.push({ href: def.href, text });
                    }
                });
            }
        });

        if (linksToCheck.length > 0) {
            process.stdout.write(`Checking ${post.title.substring(0, 20)}... `);

            for (const link of linksToCheck) {
                checkedCount++;
                const result = await checkUrl(link.href);

                if (!result.ok) {
                    process.stdout.write('x');
                    brokenLinks.push({
                        article: post.title,
                        slug: post.slug,
                        url: link.href,
                        text: link.text,
                        status: result.status,
                        error: result.error
                    });
                } else {
                    process.stdout.write('.');
                }
            }
            console.log('');
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Report');
    console.log('='.repeat(60));
    console.log(`Checked Links: ${checkedCount}`);
    console.log(`Broken Links: ${brokenLinks.length}\n`);

    if (brokenLinks.length > 0) {
        console.log('❌ Broken Links Details:');
        brokenLinks.forEach((item, index) => {
            console.log(`${index + 1}. [${item.status}] ${item.text}`);
            console.log(`   URL: ${item.url}`);
            console.log(`   Article: ${item.article}`);
            console.log(`   Link: https://prorenata.jp/posts/${item.slug}`);
            console.log('');
        });
    } else {
        console.log('✅ No broken links found in these articles.');
    }
}

main().catch(console.error);

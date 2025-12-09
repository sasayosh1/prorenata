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

// Configuration
const TIMEOUT = 10000; // 10 seconds
const USER_AGENT = 'Mozilla/5.0 (compatible; ProReNataBot/1.0; +https://prorenata.jp)';

// Helper to check URL status
function checkUrl(url) {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;

            const options = {
                method: 'HEAD',
                headers: { 'User-Agent': USER_AGENT },
                timeout: TIMEOUT
            };

            const req = protocol.request(url, options, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    resolve({ url, status: res.statusCode, ok: true });
                } else if (res.statusCode === 405) {
                    // Method Not Allowed - try GET
                    checkUrlWithGet(url).then(resolve);
                } else {
                    resolve({ url, status: res.statusCode, ok: false });
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

function checkUrlWithGet(url) {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;

            const options = {
                method: 'GET',
                headers: { 'User-Agent': USER_AGENT },
                timeout: TIMEOUT
            };

            const req = protocol.request(url, options, (res) => {
                // Consume data to free memory
                res.resume();
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    resolve({ url, status: res.statusCode, ok: true });
                } else {
                    resolve({ url, status: res.statusCode, ok: false });
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
    console.log('🔍 Checking for broken external links in all articles...\n');

    // Fetch all posts
    const posts = await client.fetch(`*[_type == "post"] {
        _id,
        title,
        "slug": slug.current,
        body
    }`);

    console.log(`Fetched ${posts.length} posts.`);

    let totalLinks = 0;
    let brokenLinks = [];
    const checkedUrls = new Map(); // Cache results

    for (const post of posts) {
        if (!post.body || !Array.isArray(post.body)) continue;

        const linksInPost = [];

        // Extract links
        post.body.forEach(block => {
            if (block.markDefs && Array.isArray(block.markDefs)) {
                block.markDefs.forEach(def => {
                    if (def._type === 'link' && def.href) {
                        // Filter for external links (simple heuristic)
                        if (def.href.startsWith('http')) {
                            linksInPost.push(def.href);
                        }
                    }
                });
            }
        });

        if (linksInPost.length === 0) continue;

        process.stdout.write(`Checking ${post.title.substring(0, 30)}... (${linksInPost.length} links) `);

        for (const link of linksInPost) {
            totalLinks++;

            let result;
            if (checkedUrls.has(link)) {
                result = checkedUrls.get(link);
            } else {
                result = await checkUrl(link);
                checkedUrls.set(link, result);
            }

            if (!result.ok) {
                brokenLinks.push({
                    article: post.title,
                    slug: post.slug,
                    url: link,
                    status: result.status,
                    error: result.error
                });
                process.stdout.write('x');
            } else {
                process.stdout.write('.');
            }
        }
        console.log('');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Report');
    console.log('='.repeat(60));
    console.log(`Total Links Checked: ${totalLinks}`);
    console.log(`Broken Links Found: ${brokenLinks.length}\n`);

    if (brokenLinks.length > 0) {
        console.log('❌ Broken Links Details:');
        brokenLinks.forEach((item, index) => {
            console.log(`${index + 1}. [${item.status}] ${item.url}`);
            console.log(`   Article: ${item.article} (https://prorenata.jp/posts/${item.slug})`);
            if (item.error) console.log(`   Error: ${item.error}`);
            console.log('');
        });
    } else {
        console.log('✅ No broken links found!');
    }
}

main().catch(console.error);

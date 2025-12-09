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
                timeout: 5000
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
    console.log('🔍 Searching for "Human Life Care" links...\n');

    const posts = await client.fetch(`*[_type == "post"] {
        title,
        "slug": slug.current,
        body
    }`);

    let foundLinks = [];

    for (const post of posts) {
        if (!post.body || !Array.isArray(post.body)) continue;

        post.body.forEach(block => {
            if (block.markDefs && Array.isArray(block.markDefs)) {
                block.markDefs.forEach(def => {
                    if (def._type === 'link' && def.href) {
                        // Check for keywords related to Human Life Care
                        if (def.href.includes('human-lifecare') ||
                            def.href.includes('kaigo-kyuujin') || // Common job site
                            def.href.includes('human') // Broad check
                        ) {

                            // Also check link text if possible (requires mapping children)
                            const linkChild = block.children.find(c => c.marks && c.marks.includes(def._key));
                            const text = linkChild ? linkChild.text : '';

                            if (text.includes('ヒューマンライフケア') || def.href.includes('human')) {
                                foundLinks.push({
                                    article: post.title,
                                    slug: post.slug,
                                    url: def.href,
                                    text: text
                                });
                            }
                        }
                    }
                });
            }
        });
    }

    console.log(`Found ${foundLinks.length} potential links.\n`);

    for (const link of foundLinks) {
        process.stdout.write(`Checking ${link.url.substring(0, 50)}... `);
        const result = await checkUrl(link.url);

        if (result.ok) {
            console.log(`✅ OK (${result.status})`);
        } else {
            console.log(`❌ BROKEN (${result.status})`);
            console.log(`   Article: ${link.article}`);
            console.log(`   Text: ${link.text}`);
        }
    }
}

main().catch(console.error);

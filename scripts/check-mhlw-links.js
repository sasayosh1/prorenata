require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const https = require('https')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const MHLW_LINKS = [
    'https://www.mhlw.go.jp/toukei/list/79-1.html',
    'https://www.mhlw.go.jp/toukei_hakusho/toukei/index.html'
]

function checkUrl(url) {
    return new Promise((resolve) => {
        const options = {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        };

        const req = https.request(url, options, (res) => {
            resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
        });

        req.on('error', (err) => resolve({ url, status: 'ERROR', ok: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ url, status: 'TIMEOUT', ok: false }); });
        req.end();
    });
}

async function main() {
    console.log('🔍 Checking MHLW links...\n');

    // Check the links directly
    for (const url of MHLW_LINKS) {
        console.log(`Checking: ${url}`);
        const result = await checkUrl(url);
        console.log(`Status: ${result.status} ${result.ok ? '✅' : '❌'}`);
        if (result.error) console.log(`Error: ${result.error}`);
        console.log('');
    }

    // Find articles using these links
    console.log('---\nFinding articles with MHLW links...\n');

    const posts = await client.fetch(`*[_type == "post" && !(_id in path("drafts.**"))] {
        title,
        "slug": slug.current,
        body
    }`);

    const articlesWithMHLW = [];

    posts.forEach(post => {
        if (!post.body) return;

        post.body.forEach(block => {
            if (block.markDefs) {
                block.markDefs.forEach(def => {
                    if (def._type === 'link' && def.href && def.href.includes('mhlw.go.jp')) {
                        const linkChild = block.children?.find(c => c.marks && c.marks.includes(def._key));
                        const text = linkChild ? linkChild.text : '(no text)';

                        articlesWithMHLW.push({
                            article: post.title,
                            slug: post.slug,
                            url: def.href,
                            text: text
                        });
                    }
                });
            }
        });
    });

    if (articlesWithMHLW.length > 0) {
        console.log(`Found ${articlesWithMHLW.length} MHLW link(s) in articles:\n`);
        articlesWithMHLW.forEach((item, i) => {
            console.log(`${i + 1}. "${item.text}"`);
            console.log(`   URL: ${item.url}`);
            console.log(`   Article: ${item.article}`);
            console.log(`   Link: https://prorenata.jp/posts/${item.slug}`);
            console.log('');
        });
    } else {
        console.log('No MHLW links found in articles.');
    }
}

main().catch(console.error);

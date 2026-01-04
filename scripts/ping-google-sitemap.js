const https = require('https');

const SITEMAP_URL = 'https://sasakiyoshimasa.com/sitemap.xml';
const PING_URL = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

function pingGoogle() {
    console.log(`📡 Pinging Google with sitemap: ${SITEMAP_URL}`);

    https.get(PING_URL, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log('✅ Successfully pinged Google. Indexing requested.');
        } else {
            console.log('⚠️ Ping returned unexpected status.');
        }
    }).on('error', (e) => {
        console.error(`❌ Ping failed: ${e.message}`);
    });
}

pingGoogle();

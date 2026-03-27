const { createClient } = require('@sanity/client');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

async function testTokens() {
    const envFiles = ['.env.local', '.env.production'];
    const projectId = '72m8vhy2';

    for (const envFile of envFiles) {
        const envPath = path.resolve(__dirname, '../', envFile);
        if (!fs.existsSync(envPath)) {
            console.log(`Skipping ${envFile} (not found)`);
            continue;
        }
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        const token = envConfig.SANITY_API_TOKEN;
        
        console.log(`\nTesting token from ${envFile}:`);
        console.log(`- Token starts with: ${token ? token.substring(0, 10) + "..." : "MISSING"}`);

        const client = createClient({
            projectId,
            dataset: 'production',
            apiVersion: '2024-01-01',
            token,
            useCdn: false
        });

        try {
            const posts = await client.fetch('*[_type == "post"][0...1]{ _id, title }');
            console.log(`✅ Success! [${envFile}] Found post: ${posts[0].title}`);
            return { token, envFile };
        } catch (err) {
            console.error(`❌ Failed! [${envFile}] Error: ${err.message}`);
        }
    }
}

testTokens().then(res => {
    if (res) {
        console.log(`\nRecommendation: Use token from ${res.envFile}`);
    } else {
        console.log("\nNo valid tokens found.");
    }
});

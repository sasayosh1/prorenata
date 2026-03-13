const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
    useCdn: false
});

async function generateSource() {
    console.log("📦 Preparing NotebookLM Source File...");

    // 1. Gather Context Files
    const masterContext = fs.readFileSync('00_システム/UserProfile/00_Master_Context.md', 'utf8');
    const values = fs.readFileSync('00_システム/UserProfile/01_Values.md', 'utf8');

    let combined = `# PRORENATA MASTER KNOWLEDGE SOURCE\n\n`;
    combined += `## CORE CONTEXT & PERSONA\n\n${masterContext}\n\n${values}\n\n`;
    combined += `## ARTICLES DATA\n\n`;

    // 2. Fetch all articles
    const query = `*[_type == "post" && !(_id in path("drafts.**"))] {
        title,
        publishedAt,
        body
    }`;
    const posts = await client.fetch(query);

    posts.forEach((post, idx) => {
        combined += `### [Article ${idx + 1}] ${post.title}\n`;
        combined += `Published: ${post.publishedAt || 'N/A'}\n\n`;
        combined += extractText(post.body);
        combined += `\n\n---\n\n`;
    });

    const outputPath = path.join(process.cwd(), 'prorenata_notebooklm_source.md');
    fs.writeFileSync(outputPath, combined);
    console.log(`✅ Source file ready: ${outputPath}`);
}

function extractText(body) {
    if (!body || !Array.isArray(body)) return '';
    return body
        .filter(b => b._type === 'block')
        .map(b => (b.children || []).map(c => (c.text || '')).join(''))
        .join('\n');
}

generateSource().catch(console.error);

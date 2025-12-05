require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

const REPORT_FILE = path.resolve(__dirname, '../reports/content_health.md');
const REPORTS_DIR = path.dirname(REPORT_FILE);

// Ensure reports dir exists
if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Extract text from Portable Text body
 */
function extractTextFromBody(body) {
    if (!body || !Array.isArray(body)) return ''

    return body
        .filter(block => block._type === 'block')
        .map(block => {
            if (!block.children) return ''
            return block.children
                .filter(child => child._type === 'span')
                .map(child => child.text || '')
                .join('')
        })
        .join('\n')
}

async function generateReport() {
    console.log('Generating Content Health Report...');

    try {
        const posts = await client.fetch(`*[_type == "post"] {
            title,
            "slug": slug.current,
            description,
            body,
            _updatedAt
        }`);

        console.log(`Fetched ${posts.length} posts.`);

        let reportContent = `# Content Health Report\nGenerated on: ${new Date().toLocaleString()}\n\n`;

        let totalChars = 0;
        let missingDescCount = 0;
        let shortArticles = [];
        let missingDescArticles = [];

        posts.forEach(post => {
            const text = extractTextFromBody(post.body);
            const charCount = text.length;
            totalChars += charCount;

            if (!post.description) {
                missingDescCount++;
                missingDescArticles.push(`- [${post.title}](/posts/${post.slug})`);
            }

            if (charCount < 1000) {
                shortArticles.push(`- [${post.title}](/posts/${post.slug}) (${charCount} chars)`);
            }
        });

        const avgChars = posts.length > 0 ? Math.round(totalChars / posts.length) : 0;

        reportContent += `## Summary\n`;
        reportContent += `- **Total Articles**: ${posts.length}\n`;
        reportContent += `- **Average Character Count**: ${avgChars}\n`;
        reportContent += `- **Missing Meta Descriptions**: ${missingDescCount}\n`;
        reportContent += `- **Short Articles (< 1000 chars)**: ${shortArticles.length}\n`;

        reportContent += `\n## Issues\n`;

        if (missingDescArticles.length > 0) {
            reportContent += `### Missing Meta Descriptions\n`;
            reportContent += missingDescArticles.join('\n') + '\n';
        } else {
            reportContent += `### Missing Meta Descriptions\nNone! 🎉\n`;
        }

        if (shortArticles.length > 0) {
            reportContent += `\n### Short Articles (< 1000 chars)\n`;
            reportContent += shortArticles.join('\n') + '\n';
        } else {
            reportContent += `\n### Short Articles\nNone! 🎉\n`;
        }

        fs.writeFileSync(REPORT_FILE, reportContent);
        console.log(`✅ Report generated at ${REPORT_FILE}`);

    } catch (error) {
        console.error('Error generating report:', error);
        process.exit(1);
    }
}

generateReport();

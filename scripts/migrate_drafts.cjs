const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(process.cwd(), 'note_draft.md');
const TARGET_DIR = path.join(process.cwd(), 'note生成記事');

function migrate() {
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error(`Source file not found: ${SOURCE_FILE}`);
        return;
    }
    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    const content = fs.readFileSync(SOURCE_FILE, 'utf-8');

    // Split by the specific header format: ## YYYY/M/D H:mm:ss (Topic: ...)
    // capturing the date and topic
    const regex = /##\s+(\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2})\s+\(Topic:\s+(.+?)\)([\s\S]*?)(?=(##\s+\d{4}\/|$))/g;

    let match;
    let count = 0;

    while ((match = regex.exec(content)) !== null) {
        const dateTimeStr = match[1];
        const topic = match[2];
        let body = match[3].trim();

        // Remove wrapping markdown code blocks if present ( ```markdown ... ``` )
        if (body.startsWith('```markdown')) {
            body = body.replace(/^```markdown\s+/, '').replace(/\s+```$/, '');
        } else if (body.startsWith('```')) {
            body = body.replace(/^```\s+/, '').replace(/\s+```$/, '');
        }

        // Extract Title from body (first h1 usually)
        const titleMatch = body.match(/^#\s*(.+)$/m);
        let title = titleMatch ? titleMatch[1].trim() : topic;

        // Simplify Title for filename (remove forbidden chars)
        const safeTitle = title.replace(/[\/\\:*?"<>|]/g, '').slice(0, 30);

        // Format Date for filename: YYYY/M/D -> YYYY-MM-DD
        const dateObj = new Date(dateTimeStr);

        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');

        const folderName = `${yyyy}-${mm}`;
        const outputDir = path.join(TARGET_DIR, folderName);

        if (!fs.existsSync(outputDir)) {
            console.log(`Creating directory: ${outputDir}`);
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filenameDate = `${yyyy}-${mm}-${dd}`;
        const filename = `${filenameDate}_${safeTitle}.md`;
        const filepath = path.join(outputDir, filename);

        fs.writeFileSync(filepath, body);
        console.log(`Migrated: ${filepath} (Topic: ${topic})`);
        count++;
    }

    console.log(`\nTotal migrated: ${count}`);
}

migrate();

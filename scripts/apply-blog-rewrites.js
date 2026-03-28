const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));

function getClient() {
    return createClient({
        projectId: (envConfig.NEXT_PUBLIC_SANITY_PROJECT_ID || '72m8vhy2').trim(),
        dataset: 'production',
        apiVersion: '2024-01-01',
        token: (envConfig.SANITY_API_TOKEN || '').trim(),
        useCdn: false
    });
}

const client = getClient();
console.log("Sanity Client Config:");
console.log("- Project ID:", client.config().projectId);
console.log("- Token prefix:", client.config().token ? client.config().token.substring(0, 10) : "MISSING");
console.log("- Dataset:", client.config().dataset);

const MAP = {
    'nursing-assistant-resume-writing.md': 'nursing-assistant-resume-writing',
    'nursing-assistant-patient-transfer-safety.md': 'nursing-assistant-patient-transfer-safety',
    'nursing-assistant-resignation-advice-insights.md': 'nursing-assistant-resignation-advice-insights',
    'nursing-assistant-part-time-day.md': 'nursing-assistant-part-time-day',
    'nursing-assistant-skillup-roadmap.md': 'nursing-assistant-skillup-roadmap',
    'nursing-assistant-night-shift-guide.md': 'nursing-assistant-night-shift-duties',
    'nursing-assistant-night-shift-only-pros-cons.md': 'nursing-assistant-night-shift',
    'nursing-assistant-latest-salary-comparison.md': 'nursing-assistant-latest-salary-comparison',
    'nursing-assistant-terminology-guide.md': 'nursing-assistant-terminology-guide',
    'nursing-assistant-medical-terms.md': 'nursing-assistant-medical-terms',
    'nursing-assistant-motivation-letter-examples.md': 'nursing-assistant-motivation-letter-examples',
    'nursing-assistant-quit-experiences.md': 'nursing-assistant-quit-experiences',
    'nursing-assistant-interview-resume-roadmap.md': 'nursing-assistant-job-change-steps'
};

const DRAFTS_DIR = path.resolve(__dirname, '../03_note/記事/blog_rewrites');

function generateKey() {
    return Math.random().toString(36).substring(2, 10);
}

function mdToBlocks(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    let currentList = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line === '') {
            currentList = null;
            continue;
        }

        // H1 (Skip title if it's #)
        if (line.startsWith('# ')) continue;

        if (line.startsWith('> ')) {
             // Custom Blocks (Speech Bubbles & Advice)
             if (line.startsWith('> [!sera-')) {
                 const emotionMatch = line.match(/> \[!sera-([^\]]+)\]/);
                 const emotion = emotionMatch ? emotionMatch[1] : 'normal';
                 // Consume next lines as text (strip leading >)
                 let text = "";
                 let j = i + 1;
                 while(j < lines.length && lines[j].trim() !== "" && (lines[j].trim().startsWith('>') || !lines[j].trim().startsWith('##'))) {
                     let contentLine = lines[j].trim();
                     if (contentLine.startsWith('> [!')) break; // Next custom block
                     text += contentLine.replace(/^>\s?/, '') + " ";
                     j++;
                 }
                 blocks.push({
                     _type: 'speechBubble',
                     _key: generateKey(),
                     speaker: 'sera',
                     emotion: emotion,
                     position: 'left',
                     text: text.trim()
                 });
                 i = j - 1;
                 continue;
             }
     
             if (line.startsWith('> [!advice]')) {
                  let text = "";
                  let j = i + 1;
                  while(j < lines.length && lines[j].trim() !== "" && (lines[j].trim().startsWith('>') || !lines[j].trim().startsWith('##'))) {
                      let contentLine = lines[j].trim();
                      if (contentLine.startsWith('> [!')) break; // Next custom block
                      text += contentLine.replace(/^>\s?/, '') + " ";
                      j++;
                  }
                  blocks.push({
                      _type: 'seraAdvice',
                      _key: generateKey(),
                      title: 'セラのアドバイス',
                      content: text.trim()
                  });
                  i = j - 1;
                  continue;
             }

             // Normal Blockquote
             let text = "";
             let j = i;
             while(j < lines.length && lines[j].trim().startsWith('> ') && !lines[j].trim().startsWith('> [!')) {
                 text += lines[j].trim().replace(/^>\s?/, '') + " ";
                 j++;
             }
             blocks.push({
                 _type: 'block',
                 _key: generateKey(),
                 style: 'blockquote',
                 children: parseInline(text.trim()),
                 markDefs: []
             });
             i = j - 1;
             continue;
        }

        // H2
        if (line.startsWith('## ')) {
            blocks.push({
                _type: 'block',
                _key: generateKey(),
                style: 'h2',
                children: parseInline(line.replace('## ', '')),
                markDefs: []
            });
            continue;
        }

        // H3
        if (line.startsWith('### ')) {
            blocks.push({
                _type: 'block',
                _key: generateKey(),
                style: 'h3',
                children: parseInline(line.replace('### ', '')),
                markDefs: []
            });
            continue;
        }

        // Bullets
        if (line.startsWith('- ') || line.startsWith('* ')) {
            blocks.push({
                _type: 'block',
                _key: generateKey(),
                listItem: 'bullet',
                level: 1,
                style: 'normal',
                children: parseInline(line.replace(/^[-*] /, '')),
                markDefs: []
            });
            continue;
        }

        // Horizontal Rule
        if (line === '---') {
            continue;
        }

        // Normal Paragraph
        blocks.push({
            _type: 'block',
            _key: generateKey(),
            style: 'normal',
            children: parseInline(line),
            markDefs: []
        });
    }

    return blocks;
}

function parseInline(text) {
    const result = [];
    // Link parser [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Bold parser **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    
    let lastIndex = 0;
    
    // We need a more robust way to handle multiple inline tags.
    // For now, let's at least handle links and bold separately in sequence or together.
    // Simplifying: replace link markers, then bold markers.
    
    let tempText = text;
    const links = [];
    const bolds = [];
    
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
        links.push({ start: match.index, end: linkRegex.lastIndex, text: match[1], href: match[2], type: 'link' });
    }
    while ((match = boldRegex.exec(text)) !== null) {
        bolds.push({ start: match.index, end: boldRegex.lastIndex, text: match[1], type: 'bold' });
    }
    
    const allMatches = [...links, ...bolds].sort((a, b) => a.start - b.start);
    
    lastIndex = 0;
    for (const m of allMatches) {
        if (m.start >= lastIndex) {
            if (m.start > lastIndex) {
                result.push({ _type: 'span', text: text.substring(lastIndex, m.start), marks: [] });
            }
            
            if (m.type === 'link') {
                const markKey = `link-${generateKey()}`;
                result.push({
                    _type: 'span',
                    text: m.text,
                    marks: [markKey],
                    _linkKey: markKey,
                    _href: m.href
                });
            } else if (m.type === 'bold') {
                result.push({
                    _type: 'span',
                    text: m.text,
                    marks: ['strong']
                });
            }
            lastIndex = m.end;
        }
    }
    
    if (lastIndex < text.length) {
        result.push({ _type: 'span', text: text.substring(lastIndex), marks: [] });
    }
    
    if (result.length === 0) return [{ _type: 'span', text: text, marks: [] }];
    return result;
}

function finalizeBlocks(blocks) {
    // Process temp markers for links
    blocks.forEach(block => {
        if (block._type === 'block' && block.children) {
            block.children.forEach(span => {
                if (span._linkKey) {
                    block.markDefs.push({
                        _key: span._linkKey,
                        _type: 'link',
                        href: span._href
                    });
                    delete span._linkKey;
                    delete span._href;
                }
            });
        }
    });
    return blocks;
}

async function run() {
    console.log("Starting Sanity update...");

    for (const [file, slug] of Object.entries(MAP)) {
        const filePath = path.join(DRAFTS_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${file}`);
            continue;
        }

        console.log(`\nProcessing: ${slug} (${file})...`);
        const markdown = fs.readFileSync(filePath, 'utf8');
        const newBlocks = finalizeBlocks(mdToBlocks(markdown));

        // Fetch existing post to keep some metadata/affiliate blocks
        const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug });
        if (!post) {
            console.error(`Post not found in Sanity: ${slug}`);
            continue;
        }

        // Keep affiliateEmbed blocks from old body
        const affiliateBlocks = post.body ? post.body.filter(b => b._type === 'affiliateEmbed') : [];
        
        // Find "まとめ" index in new blocks to insert affiliate blocks before it
        let insertIndex = newBlocks.findIndex(b => b.style === 'h2' && b.children && b.children[0] && b.children[0].text === 'まとめ');
        
        const finalBody = [...newBlocks];
        if (affiliateBlocks.length > 0) {
            if (insertIndex !== -1) {
                console.log(`  Inserting ${affiliateBlocks.length} affiliate blocks before "まとめ".`);
                finalBody.splice(insertIndex, 0, ...affiliateBlocks);
            } else {
                console.log(`  Appending ${affiliateBlocks.length} affiliate blocks to the end.`);
                finalBody.push(...affiliateBlocks);
            }
        }

        try {
            console.log(`  Updating post ${post._id}...`);
            await client.patch(post._id).set({ body: finalBody }).commit();
            console.log(`  ✅ Successfully updated and published: ${slug}`);
        } catch (err) {
            console.error(`  ❌ Failed to update ${slug}:`, err.message);
        }
    }

    console.log("\nAll updates completed!");
}

run().catch(console.error);

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { inboxDir, uniquePath } = require('./utils/antigravityPaths.cjs');

// Configuration
const SOURCE_DIR = '/Users/sasakiyoshimasa/prorenata/白崎セラ';
// Write generated images into the local inbox (never auto-write into repo/public).
const OUTPUT_DIR = inboxDir('prorenata', 'thumbnails');
const PYTHON_SCRIPT = '/Users/sasakiyoshimasa/prorenata/scripts/process-thumbnails.py';

// Sanity Client
const client = createClient({
    projectId: '72m8vhy2',
    dataset: 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

// List of available images in SOURCE_DIR
const AVAILABLE_IMAGES = [
    'uploaded_image_0_1764034807429.png',
    'uploaded_image_1_1764034807429.png',
    'uploaded_image_2_1764033203554.png',
    'uploaded_image_3_1764033203554.png',
    'uploaded_image_4_1764033203554.png',
    'sera_communication_1200x630.png',
    'sera_guide_1200x630.png',
    'sera_recruitment_1200x630.png',
    'sera_roles_1200x630.png',
    'sera_scholarship_1200x630.png'
];

async function getTargetArticles() {
    console.log('Fetching articles without main image...');
    // Fetch posts that don't have a mainImage set
    const query = `*[_type == "post" && !defined(mainImage)][0...5] { _id, title, "slug": slug.current }`;
    const posts = await client.fetch(query);

    if (posts.length === 0) {
        console.log('No articles found without main image. Fetching recent 5 articles instead.');
        const fallbackQuery = `*[_type == "post"] | order(publishedAt desc)[0...5] { _id, title, "slug": slug.current }`;
        return await client.fetch(fallbackQuery);
    }

    return posts;
}

async function processImage(imageName, slug) {
  const sourcePath = path.join(SOURCE_DIR, imageName);

    // Create a temporary python script to run the processing logic
    // We reuse the logic from process-thumbnails.py but call it for a specific file
    const tempScriptPath = path.join(__dirname, `temp_process_${slug}.py`);

    const outputPath = uniquePath(path.join(OUTPUT_DIR, `${slug}_1200x630.png`));
    const pythonCode = `
from PIL import Image, ImageFilter
import os

SOURCE_PATH = "${sourcePath}"
OUTPUT_PATH = "${outputPath}"
TARGET_WIDTH = 1200
TARGET_HEIGHT = 675

def process():
    if not os.path.exists(SOURCE_PATH):
        print(f"Error: {SOURCE_PATH} not found")
        return

    try:
        with Image.open(SOURCE_PATH) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Background (Blur)
            target_ratio = TARGET_WIDTH / TARGET_HEIGHT
            img_ratio = img.width / img.height
            
            if img_ratio > target_ratio:
                bg_scale = TARGET_HEIGHT / img.height
            else:
                bg_scale = TARGET_WIDTH / img.width
                
            bg_resize_width = int(img.width * bg_scale)
            bg_resize_height = int(img.height * bg_scale)
            
            bg_img = img.resize((bg_resize_width, bg_resize_height), Image.Resampling.LANCZOS)
            
            left = (bg_resize_width - TARGET_WIDTH) / 2
            top = (bg_resize_height - TARGET_HEIGHT) / 2
            right = (bg_resize_width + TARGET_WIDTH) / 2
            bottom = (bg_resize_height + TARGET_HEIGHT) / 2
            
            bg_img = bg_img.crop((left, top, right, bottom))
            bg_img = bg_img.filter(ImageFilter.GaussianBlur(radius=20))
            
            # Foreground (Fit)
            if img_ratio > target_ratio:
                fg_scale = TARGET_WIDTH / img.width
            else:
                fg_scale = TARGET_HEIGHT / img.height
                
            fg_resize_width = int(img.width * fg_scale)
            fg_resize_height = int(img.height * fg_scale)
            
            fg_img = img.resize((fg_resize_width, fg_resize_height), Image.Resampling.LANCZOS)
            
            paste_x = (TARGET_WIDTH - fg_resize_width) // 2
            paste_y = (TARGET_HEIGHT - fg_resize_height) // 2
            
            bg_img.paste(fg_img, (paste_x, paste_y))
            
            os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
            bg_img.save(OUTPUT_PATH)
            print(f"SUCCESS: {OUTPUT_PATH}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process()
`;

    fs.writeFileSync(tempScriptPath, pythonCode);

    try {
        const output = execSync(`python3 ${tempScriptPath}`).toString();
        console.log(output);
        fs.unlinkSync(tempScriptPath); // Clean up

        if (output.includes('SUCCESS:')) {
            return path.join(OUTPUT_DIR, `${slug}_1200x630.png`);
        }
    } catch (error) {
        console.error(`Error processing image for ${slug}:`, error.message);
        if (fs.existsSync(tempScriptPath)) fs.unlinkSync(tempScriptPath);
    }
    return null;
}

async function uploadAndPatch(postId, imagePath) {
    if (!fs.existsSync(imagePath)) return;

    console.log(`Uploading ${path.basename(imagePath)}...`);
    const fileStream = fs.createReadStream(imagePath);
    try {
        const asset = await client.assets.upload('image', fileStream, {
            filename: path.basename(imagePath)
        });

        await client.patch(postId).set({
            mainImage: {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: asset._id
                }
            }
        }).commit();
        console.log(`Updated post ${postId}`);
    } catch (error) {
        console.error(`Failed to upload/patch ${postId}:`, error.message);
    }
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');
    const posts = await getTargetArticles();

    console.log(`Found ${posts.length} articles to update.`);

    for (const post of posts) {
        console.log(`\nProcessing: ${post.title} (${post.slug})`);

        // Pick a random image
        const randomImage = AVAILABLE_IMAGES[Math.floor(Math.random() * AVAILABLE_IMAGES.length)];
        console.log(`Selected source image: ${randomImage}`);

        if (dryRun) {
            console.log('[Dry Run] Would process and upload image.');
            continue;
        }

        const processedPath = await processImage(randomImage, post.slug);
        if (processedPath) {
            await uploadAndPatch(post._id, processedPath);
        }
    }
}

main();

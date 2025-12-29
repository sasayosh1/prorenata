from PIL import Image
import os
import glob
from utils.antigravity_paths import inbox_dir, unique_path

# Configuration
TARGET_WIDTH = 1200
TARGET_HEIGHT = 675 # 16:9 aspect ratio
SOURCE_DIR = '/Users/sasakiyoshimasa/.gemini/antigravity/brain/3188755c-34ca-4ce2-a567-4f288d0d547c'
OUTPUT_DIR = inbox_dir("prorenata", "thumbnails")

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Map source filenames to slug hints (for output naming)
# Map source filenames to slug hints (for output naming)
# Using absolute paths for source files
IMAGE_MAPPING = {
    '/Users/sasakiyoshimasa/.gemini/antigravity/brain/59c92d7d-509d-4b3c-8d2e-2ef7d8eef768/sera_shoes_thumbnail_1764332762241.png': 'sera_shoes',
    '/Users/sasakiyoshimasa/prorenata/白崎セラ/uploaded_image_0_1764034807429.png': 'sera_guide',
    '/Users/sasakiyoshimasa/prorenata/白崎セラ/uploaded_image_0_1764034886037.png': 'sera_scholarship',
    '/Users/sasakiyoshimasa/prorenata/白崎セラ/uploaded_image_1_1764034807429.png': 'sera_communication',
    '/Users/sasakiyoshimasa/prorenata/白崎セラ/uploaded_image_2_1764033203554.png': 'sera_roles',
    '/Users/sasakiyoshimasa/prorenata/白崎セラ/uploaded_image_3_1764033203554.png': 'sera_recruitment'
}

def process_image(filename, slug_hint):
    # Check if filename is absolute path
    if os.path.isabs(filename):
        source_path = filename
    else:
        source_path = os.path.join(SOURCE_DIR, filename)
        
    if not os.path.exists(source_path):
        print(f"File not found: {source_path}")
        return

    try:
        with Image.open(source_path) as img:
            # Convert to RGB if necessary (e.g. for PNGs with transparency)
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # 1. Create the background (blurred version of the image filling the target area)
            # Resize to cover the target area
            target_ratio = TARGET_WIDTH / TARGET_HEIGHT
            img_ratio = img.width / img.height
            
            if img_ratio > target_ratio:
                # Wider: scale by height
                bg_scale = TARGET_HEIGHT / img.height
            else:
                # Taller: scale by width
                bg_scale = TARGET_WIDTH / img.width
                
            bg_resize_width = int(img.width * bg_scale)
            bg_resize_height = int(img.height * bg_scale)
            
            bg_img = img.resize((bg_resize_width, bg_resize_height), Image.Resampling.LANCZOS)
            
            # Center crop the background to exact target size
            left = (bg_resize_width - TARGET_WIDTH) / 2
            top = (bg_resize_height - TARGET_HEIGHT) / 2
            right = (bg_resize_width + TARGET_WIDTH) / 2
            bottom = (bg_resize_height + TARGET_HEIGHT) / 2
            
            bg_img = bg_img.crop((left, top, right, bottom))
            
            # Blur the background
            from PIL import ImageFilter
            bg_img = bg_img.filter(ImageFilter.GaussianBlur(radius=20))
            
            # 2. Resize the main image to fit WITHIN the target area
            # We want the largest dimension to match the target, keeping aspect ratio
            
            if img_ratio > target_ratio:
                # Wider: fit to width
                fg_scale = TARGET_WIDTH / img.width
            else:
                # Taller: fit to height
                fg_scale = TARGET_HEIGHT / img.height
                
            fg_resize_width = int(img.width * fg_scale)
            fg_resize_height = int(img.height * fg_scale)
            
            fg_img = img.resize((fg_resize_width, fg_resize_height), Image.Resampling.LANCZOS)
            
            # 3. Paste the fitted image onto the blurred background
            paste_x = (TARGET_WIDTH - fg_resize_width) // 2
            paste_y = (TARGET_HEIGHT - fg_resize_height) // 2
            
            bg_img.paste(fg_img, (paste_x, paste_y))
            
            output_filename = f"{slug_hint}_1200x630.png"
            output_path = unique_path(os.path.join(OUTPUT_DIR, output_filename))
            bg_img.save(output_path)
            print(f"Processed {filename} -> {output_path}")
            return output_path

    except Exception as e:
        print(f"Error processing {filename}: {e}")

def main():
    processed_files = []
    for filename, slug_hint in IMAGE_MAPPING.items():
        path = process_image(filename, slug_hint)
        if path:
            processed_files.append(path)
            
    print(f"Successfully processed {len(processed_files)} images.")

if __name__ == "__main__":
    main()

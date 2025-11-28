from PIL import Image
import os
import glob

# Configuration
TARGET_WIDTH = 1200
TARGET_HEIGHT = 675 # 16:9 aspect ratio
SOURCE_DIR = '/Users/sasakiyoshimasa/.gemini/antigravity/brain/3188755c-34ca-4ce2-a567-4f288d0d547c'
OUTPUT_DIR = '/Users/sasakiyoshimasa/prorenata/processed_images'

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Map source filenames to slug hints (for output naming)
IMAGE_MAPPING = {
    'fixed_shoes_v2_1764248764438.png': 'nursing-assistant-recommended-shoes',
    'fixed_whiteboard_v2_1764248834149.png': 'nursing-assistant-types',
    'fixed_image_2_1764227493811.png': 'nurse_elderly',
    'fixed_image_3_1764227634439.png': 'salary_career',
    'fixed_image_4_1764227722925.png': 'scholarship'
}

def process_image(filename, slug_hint):
    source_path = os.path.join(SOURCE_DIR, filename)
    if not os.path.exists(source_path):
        print(f"File not found: {source_path}")
        return

    try:
        with Image.open(source_path) as img:
            # Calculate aspect ratios
            target_ratio = TARGET_WIDTH / TARGET_HEIGHT
            img_ratio = img.width / img.height

            if img_ratio > target_ratio:
                # Image is wider than target
                new_height = TARGET_HEIGHT
                new_width = int(new_height * img_ratio)
            else:
                # Image is taller than target
                new_width = TARGET_WIDTH
                new_height = int(new_width / img_ratio)

            # Resize first (keeping aspect ratio)
            # We want to resize such that the smaller dimension matches the target
            # So we cover the target area
            
            if img_ratio > target_ratio:
                # Wider: scale by height
                scale = TARGET_HEIGHT / img.height
            else:
                # Taller: scale by width
                scale = TARGET_WIDTH / img.width
            
            resize_width = int(img.width * scale)
            resize_height = int(img.height * scale)
            
            img = img.resize((resize_width, resize_height), Image.Resampling.LANCZOS)
            
            # Center Crop
            left = (resize_width - TARGET_WIDTH) / 2
            top = (resize_height - TARGET_HEIGHT) / 2
            right = (resize_width + TARGET_WIDTH) / 2
            bottom = (resize_height + TARGET_HEIGHT) / 2
            
            img = img.crop((left, top, right, bottom))
            
            output_filename = f"{slug_hint}_1200x630.png"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            img.save(output_path)
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

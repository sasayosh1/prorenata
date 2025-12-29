from PIL import Image
import os
import sys
from utils.antigravity_paths import inbox_dir, unique_path

INPUT_PATH = os.environ.get('INPUT_PATH') or (sys.argv[1] if len(sys.argv) > 1 else '/Users/sasakiyoshimasa/.gemini/antigravity/brain/59c92d7d-509d-4b3c-8d2e-2ef7d8eef768/sera_shoes_v4_square_1764368015314.png')
OUTPUT_PATH = os.environ.get('OUTPUT_PATH') or (sys.argv[2] if len(sys.argv) > 2 else unique_path(os.path.join(inbox_dir("prorenata", "images"), 'sera_shoes_v4_1024x576.png')))
TARGET_SIZE = (1024, 576)

def crop_image():
    if not os.path.exists(INPUT_PATH):
        print(f"Input file not found: {INPUT_PATH}")
        return

    with Image.open(INPUT_PATH) as img:
        # img is 1024x1024
        # We want to crop to 1024x576 from the center (or slightly adjusted if needed)
        
        width, height = img.size
        target_width, target_height = TARGET_SIZE
        
        left = 0
        right = width
        
        # Calculate top/bottom to keep the top portion (cut only from bottom)
        top = 0
        bottom = target_height
        
        # Crop
        cropped_img = img.crop((left, top, right, bottom))
        
        cropped_img.save(OUTPUT_PATH)
        print(f"Cropped image saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    crop_image()

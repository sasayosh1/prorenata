from PIL import Image
import os
import sys
from utils.antigravity_paths import inbox_dir, unique_path

INPUT_PATH = os.environ.get('INPUT_PATH') or (sys.argv[1] if len(sys.argv) > 1 else '/Users/sasakiyoshimasa/.gemini/antigravity/brain/59c92d7d-509d-4b3c-8d2e-2ef7d8eef768/sera_shoes_creative_1764367728692.png')
OUTPUT_PATH = os.environ.get('OUTPUT_PATH') or (sys.argv[2] if len(sys.argv) > 2 else unique_path(os.path.join(inbox_dir("prorenata", "images"), 'sera_shoes_creative_1024x576.png')))
TARGET_SIZE = (1024, 576)

def resize_image():
    if not os.path.exists(INPUT_PATH):
        print(f"Input file not found: {INPUT_PATH}")
        return

    with Image.open(INPUT_PATH) as img:
        # Resize to exact dimensions (LANCZOS for quality)
        resized_img = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
        
        resized_img.save(OUTPUT_PATH)
        print(f"Resized image saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    resize_image()

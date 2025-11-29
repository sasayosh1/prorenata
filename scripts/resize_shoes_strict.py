from PIL import Image
import os

INPUT_PATH = '/Users/sasakiyoshimasa/.gemini/antigravity/brain/59c92d7d-509d-4b3c-8d2e-2ef7d8eef768/sera_shoes_strict_1764365158037.png'
OUTPUT_PATH = '/Users/sasakiyoshimasa/prorenata/processed_images/sera_shoes_strict_1024x576.png'
TARGET_SIZE = (1024, 576)

def resize_image():
    if not os.path.exists(INPUT_PATH):
        print(f"Input file not found: {INPUT_PATH}")
        return

    with Image.open(INPUT_PATH) as img:
        # Resize to exact dimensions (LANCZOS for quality)
        # Since the generated image is likely already 16:9, this should just scale it.
        # If it's not exactly 16:9, this might stretch it slightly, but generate_image usually respects aspect ratio.
        resized_img = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        
        resized_img.save(OUTPUT_PATH)
        print(f"Resized image saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    resize_image()

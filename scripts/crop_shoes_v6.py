from PIL import Image
import os

INPUT_PATH = '/Users/sasakiyoshimasa/.gemini/antigravity/brain/59c92d7d-509d-4b3c-8d2e-2ef7d8eef768/sera_shoes_v6_identity_1764370556466.png'
OUTPUT_PATH = '/Users/sasakiyoshimasa/prorenata/processed_images/sera_shoes_v6_1024x576.png'
TARGET_SIZE = (1024, 576)

def crop_image():
    if not os.path.exists(INPUT_PATH):
        print(f"Input file not found: {INPUT_PATH}")
        return

    with Image.open(INPUT_PATH) as img:
        # img is 1024x1024
        # Crop to 1024x576 from center
        
        width, height = img.size
        target_width, target_height = TARGET_SIZE
        
        left = 0
        right = width
        
        # Calculate top/bottom to keep the top portion (cut only from bottom)
        top = 0
        bottom = target_height
        
        cropped_img = img.crop((left, top, right, bottom))
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        
        cropped_img.save(OUTPUT_PATH)
        print(f"Cropped image saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    crop_image()

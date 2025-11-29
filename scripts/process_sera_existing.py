from PIL import Image, ImageOps
import os

INPUT_PATH = '/Users/sasakiyoshimasa/prorenata/白崎セラ/uploaded_image_0_1764034807429.png'
OUTPUT_PATH = '/Users/sasakiyoshimasa/prorenata/processed_images/sera_shoes_existing_1024x576.png'
TARGET_SIZE = (1024, 576)

def process_image():
    if not os.path.exists(INPUT_PATH):
        print(f"Input file not found: {INPUT_PATH}")
        return

    with Image.open(INPUT_PATH) as img:
        # Create a new white background image (or black, or average color)
        # Since it's only 2 pixels difference, white or black is fine. Let's use white.
        new_img = Image.new("RGB", TARGET_SIZE, (255, 255, 255))
        
        # Calculate position to center the image
        # img is 1024x574, target is 1024x576
        # x_offset = 0
        # y_offset = (576 - 574) // 2 = 1
        x_offset = (TARGET_SIZE[0] - img.width) // 2
        y_offset = (TARGET_SIZE[1] - img.height) // 2
        
        new_img.paste(img, (x_offset, y_offset))
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        
        new_img.save(OUTPUT_PATH)
        print(f"Processed image saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    process_image()

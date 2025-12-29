import os
import random
from PIL import Image, ImageOps
from utils.antigravity_paths import inbox_dir, unique_path

SOURCE_DIR = '/Users/sasakiyoshimasa/prorenata/白崎セラ'
OUTPUT_PATH = unique_path(os.path.join(inbox_dir("prorenata", "images"), "sera_composite_1024x576.png"))
TARGET_SIZE = (1024, 576)

def create_composite():
    # Get list of valid images
    valid_extensions = ('.jpg', '.jpeg', '.png')
    images = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(valid_extensions)]
    
    if len(images) < 2:
        print("Not enough images to combine.")
        return

    # Select 2 random images
    selected_files = random.sample(images, 2)
    img1_path = os.path.join(SOURCE_DIR, selected_files[0])
    img2_path = os.path.join(SOURCE_DIR, selected_files[1])
    
    print(f"Combining {selected_files[0]} and {selected_files[1]}")

    with Image.open(img1_path) as img1, Image.open(img2_path) as img2:
        # Create canvas
        canvas = Image.new('RGB', TARGET_SIZE, (255, 255, 255))
        
        # Resize images to cover half the width each (512x576) maintaining aspect ratio, then crop
        half_size = (512, 576)
        
        # Helper to fit image into half_size
        def fit_image(img, size):
            return ImageOps.fit(img, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))

        img1_fit = fit_image(img1, half_size)
        img2_fit = fit_image(img2, half_size)
        
        # Paste side by side
        canvas.paste(img1_fit, (0, 0))
        canvas.paste(img2_fit, (512, 0))
        
        canvas.save(OUTPUT_PATH)
        print(f"Composite image saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    create_composite()

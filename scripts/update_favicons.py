import os
import shutil
from PIL import Image

# Configuration
SOURCE_IMAGE_PATH = '/Users/sasakiyoshimasa/prorenata/public/sera/favicon_source - 編集済み.png'
PUBLIC_DIR = '/Users/sasakiyoshimasa/prorenata/public'
BACKUP_DIR = os.path.join(PUBLIC_DIR, 'favicon_backup')

# Files to generate and their sizes
TARGETS = {
    'favicon-16x16.png': (16, 16),
    'favicon-32x32.png': (32, 32),
    'favicon-96x96.png': (96, 96),
    'favicon-512x512.png': (512, 512),
    'apple-touch-icon.png': (180, 180),
}

def backup_existing_files():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"Created backup directory: {BACKUP_DIR}")

    files_to_backup = list(TARGETS.keys()) + ['favicon.ico']
    
    for filename in files_to_backup:
        src_path = os.path.join(PUBLIC_DIR, filename)
        if os.path.exists(src_path):
            dst_path = os.path.join(BACKUP_DIR, filename)
            shutil.copy2(src_path, dst_path)
            print(f"Backed up: {filename}")

def generate_favicons():
    if not os.path.exists(SOURCE_IMAGE_PATH):
        print(f"Error: Source image not found at {SOURCE_IMAGE_PATH}")
        return

    try:
        img = Image.open(SOURCE_IMAGE_PATH)
        print(f"Loaded source image: {SOURCE_IMAGE_PATH} size={img.size}")
    except Exception as e:
        print(f"Error loading source image: {e}")
        return

    # Generate PNGs
    for filename, size in TARGETS.items():
        try:
            # Resize with high quality resampling (LANCZOS)
            resized_img = img.resize(size, Image.Resampling.LANCZOS)
            save_path = os.path.join(PUBLIC_DIR, filename)
            resized_img.save(save_path)
            print(f"Generated: {filename} ({size})")
        except Exception as e:
            print(f"Error generating {filename}: {e}")

    # Generate ICO (Multi-size)
    try:
        ico_sizes = [(16, 16), (32, 32), (48, 48)]
        ico_images = []
        for size in ico_sizes:
            ico_images.append(img.resize(size, Image.Resampling.LANCZOS))
        
        save_path = os.path.join(PUBLIC_DIR, 'favicon.ico')
        # Save as ICO containing multiple sizes. 
        # The first image is saved, and 'append_images' adds the rest.
        ico_images[0].save(save_path, format='ICO', sizes=ico_sizes, append_images=ico_images[1:])
        print(f"Generated: favicon.ico {ico_sizes}")
    except Exception as e:
        print(f"Error generating favicon.ico: {e}")

if __name__ == "__main__":
    print("Starting favicon update...")
    backup_existing_files()
    generate_favicons()
    print("Favicon update completed.")

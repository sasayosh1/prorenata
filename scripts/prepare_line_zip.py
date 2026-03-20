import os
from PIL import Image
import zipfile

SOURCE_DIR = "/Users/sasakiyoshimasa/prorenata/LINEスタンプ"
OUTPUT_DIR = "/Users/sasakiyoshimasa/prorenata/LINEスタンプ/temp_pack"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Selection of the best 8 stickers
STICKER_FILES = [
    "04_arigatou.png",
    "06_ryoukai_kanji_simple.png",
    "sumimasen_refined.png",
    "yoroshiku_refined.png",
    "01_ittekimasu.png",
    "02_owatta.png",
    "11_genkai.png",
    "21_yattaa1.png"
]

def process_image(src_name, dest_name, size=None):
    src_path = os.path.join(SOURCE_DIR, src_name)
    dest_path = os.path.join(OUTPUT_DIR, dest_name)
    
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        if size:
            # Maintain aspect ratio for resize
            img.thumbnail(size, Image.Resampling.LANCZOS)
            # Create a centered image if needed, or just resize
            # For LINE, transparent padding is fine.
            new_img = Image.new("RGBA", size, (0, 0, 0, 0))
            new_img.paste(img, ((size[0] - img.width) // 2, (size[1] - img.height) // 2))
            img = new_img
        else:
            # Ensure it fits within 370x320
            MAX_SIZE = (370, 320)
            img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
        
        img.save(dest_path, "PNG")

# 1. Process 01-08
for i, filename in enumerate(STICKER_FILES):
    process_image(filename, f"{i+1:02d}.png")

# 2. Main (240x240)
process_image("04_arigatou.png", "main.png", (240, 240))

# 3. Tab (96x74)
process_image("06_ryoukai_kanji_simple.png", "tab.png", (96, 74))

# Create ZIP
zip_path = "/Users/sasakiyoshimasa/prorenata/LINEスタンプ/sera_stickers_pack.zip"
files_to_zip = ["main.png", "tab.png"] + [f"{i+1:02d}.png" for i in range(len(STICKER_FILES))]
with zipfile.ZipFile(zip_path, 'w') as zipf:
    for f in files_to_zip:
        zipf.write(os.path.join(OUTPUT_DIR, f), f)

# Cleanup
import shutil
shutil.rmtree(OUTPUT_DIR)

print(f"ZIP created at: {zip_path}")

import os
from PIL import Image
import zipfile

SOURCE_DIR = "/Users/sasakiyoshimasa/prorenata/LINEスタンプ"
OUTPUT_DIR = "/Users/sasakiyoshimasa/prorenata/LINEスタンプ/temp_pack_24"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Selection of the best 24 stickers
STICKER_FILES = [
    "04_arigatou.png",
    "06_ryoukai_kanji_simple.png",
    "sumimasen_refined.png",
    "yoroshiku_refined.png",
    "01_ittekimasu.png",
    "02_owatta.png",
    "11_genkai.png",
    "21_yattaa1.png",
    "ohayougozaimasu透過.png",
    "otsukaresamadesu2.png",
    "daijoubudesu透過.png",
    "ryoukaidesu透過.png",
    "12_tasukete.png",
    "13_sun.png",
    "sera_master_05_break_art.png",
    "sera_master_08_daijoubu_art.png",
    "sera_master_06_sumimasen_art.png",
    "sera_approved_sample.png",
    "arigatougozaimasu透過.png",
    "ohayo-透過.png",
    "06_ryoukai_kanji.png",
    "sera_master_break_navy.png",
    "sera_stamp_v2_step2_arigatou_luxurious_v3_1766961562363.png",
    "sera_stamp_v4_step4_shouchi_sincere_chibi_fixed_v2_1766973554153.png"
]

def process_image(src_name, dest_name, size=None):
    src_path = os.path.join(SOURCE_DIR, src_name)
    dest_path = os.path.join(OUTPUT_DIR, dest_name)
    
    if not os.path.exists(src_path):
        print(f"Warning: {src_path} not found. Skipping.")
        return False
    
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        if size:
            img.thumbnail(size, Image.Resampling.LANCZOS)
            new_img = Image.new("RGBA", size, (0, 0, 0, 0))
            new_img.paste(img, ((size[0] - img.width) // 2, (size[1] - img.height) // 2))
            img = new_img
        else:
            MAX_SIZE = (370, 320)
            img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
        
        img.save(dest_path, "PNG")
    return True

# 1. Process 01-24
actual_files = []
for i, filename in enumerate(STICKER_FILES):
    success = process_image(filename, f"{i+1:02d}.png")
    if success:
        actual_files.append(f"{i+1:02d}.png")

# 2. Main (240x240)
process_image("04_arigatou.png", "main.png", (240, 240))

# 3. Tab (96x74)
process_image("06_ryoukai_kanji_simple.png", "tab.png", (96, 74))

# Create ZIP
zip_path = "/Users/sasakiyoshimasa/prorenata/LINEスタンプ/sera_stickers_24pack.zip"
files_to_zip = ["main.png", "tab.png"] + actual_files
with zipfile.ZipFile(zip_path, 'w') as zipf:
    for f in files_to_zip:
        zipf.write(os.path.join(OUTPUT_DIR, f), f)

# Cleanup
import shutil
shutil.rmtree(OUTPUT_DIR)

print(f"ZIP created at: {zip_path}")
print(f"Total stickers included: {len(actual_files)}")

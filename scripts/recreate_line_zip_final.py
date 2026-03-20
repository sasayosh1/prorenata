import os
import zipfile
import re
from PIL import Image, ImageChops

FINAL_DIR = "/Users/sasakiyoshimasa/prorenata/LINEスタンプ/ver.1_final"
PROCESSED_DIR = "/Users/sasakiyoshimasa/prorenata/LINEスタンプ/temp_fix_processed"
os.makedirs(PROCESSED_DIR, exist_ok=True)
ZIP_PATH = os.path.join(FINAL_DIR, "sera_stickers_24pack.zip")

def trim_transparency(img):
    bg = Image.new(img.mode, img.size, (0,0,0,0))
    diff = ImageChops.difference(img, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

def create_tight_fit_image(src_path, dest_path, target_size, margin_ratio=0.1):
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found")
        return
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        img = trim_transparency(img)
        margin_w = int(target_size[0] * margin_ratio)
        margin_h = int(target_size[1] * margin_ratio)
        work_w, work_h = target_size[0] - margin_w*2, target_size[1] - margin_h*2
        
        ratio = min(work_w / img.width, work_h / img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        new_img = Image.new("RGBA", target_size, (0, 0, 0, 0))
        new_img.paste(img, ((target_size[0] - img.width) // 2, (target_size[1] - img.height) // 2))
        new_img.save(dest_path, "PNG", optimize=False)

# Explicitly use 06_ryoukai_kanji1.png for tab.png
create_tight_fit_image(os.path.join(FINAL_DIR, "06_ryoukai_kanji1.png"), os.path.join(PROCESSED_DIR, "tab.png"), (96, 74))
# Use 04_arigatou1.png for main.png
create_tight_fit_image(os.path.join(FINAL_DIR, "04_arigatou1.png"), os.path.join(PROCESSED_DIR, "main.png"), (240, 240))

# Get all png files in ver.1_final for stickers
files = [f for f in os.listdir(FINAL_DIR) if f.endswith(".png")]

with zipfile.ZipFile(ZIP_PATH, 'w') as zipf:
    for f in files:
        src_uri = os.path.join(FINAL_DIR, f)
        match = re.match(r'^(\d{2})_.*\.png$', f)
        if match:
            clean_name = f"{match.group(1)}.png"
            zipf.write(src_uri, clean_name)
    
    # Add generated main/tab
    zipf.write(os.path.join(PROCESSED_DIR, "main.png"), "main.png")
    zipf.write(os.path.join(PROCESSED_DIR, "tab.png"), "tab.png")

print(f"ZIP Recreated at: {ZIP_PATH} using specific sources for main and tab.")

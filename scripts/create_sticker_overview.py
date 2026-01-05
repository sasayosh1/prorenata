from PIL import Image
import os

STIP_DIR = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp"
OUTPUT = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_8set_overview.png"

FILES = [
    "sera_sticker_02_morning_final.png", #1
    "sera_master_02_arigatou_art.png", #2
    "sera_master_03_odaijini_art.png", #3
    "sera_master_04_ryoukai_art.png", #4
    "sera_master_05_break_art.png",   #5
    "sera_master_06_sumimasen_natural_v1_1767049589703.png", #6
    "sera_master_07_yoroshiku_art.png", #7
    "sera_master_08_daijoubu_art.png"   #8
]

def create_grid():
    # Grid 4x2
    cols = 4
    rows = 2
    thumb_size = 256
    padding = 20
    
    grid_img = Image.new("RGBA", (cols * thumb_size + (cols+1)*padding, rows * thumb_size + (rows+1)*padding), (240, 240, 240, 255))
    
    for i, filename in enumerate(FILES):
        path = os.path.join(STIP_DIR, filename)
        if not os.path.exists(path):
            print(f"Warning: {path} not found")
            continue
            
        img = Image.open(path).convert("RGBA")
        img.thumbnail((thumb_size, thumb_size))
        
        c = i % cols
        r = i // cols
        
        x = c * thumb_size + (c+1)*padding
        y = r * thumb_size + (r+1)*padding
        
        grid_img.paste(img, (x, y), img)
        
    grid_img.save(OUTPUT)
    print(f"Created overview grid: {OUTPUT}")

if __name__ == "__main__":
    create_grid()

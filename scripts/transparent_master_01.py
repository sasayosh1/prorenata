from PIL import Image, ImageDraw
import os

INPUT = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_master_01_morning_trans_1767015109894.png"
OUTPUT = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_01_morning_final.png"

def make_transparent():
    if not os.path.exists(INPUT):
        print(f"Error: {INPUT} not found")
        return

    img = Image.open(INPUT).convert("RGBA")
    data = img.getdata()
    
    # The generated image has a solid off-white background.
    # We will use flood fill from the corners to remove it, which is safer than simple color replacement.
    
    # 1. Identify background color (usually at 0,0)
    bg_color = img.getpixel((0, 0))
    print(f"Background color detected at (0,0): {bg_color}")
    
    # 2. Use flood fill to create a mask
    # We'll use a tolerance to catch JPEG-like artifacts at the edges
    mask = Image.new("L", img.size, 0)
    # Flood fill with tolerance is not directly in PIL, but we can do a trick or color-based if the character has a clean outline.
    # Let's try color replacement with tolerance first as the character has a strong brown/navy outline.
    
    new_data = []
    for p in data:
        r, g, b, a = p
        # If color is close to the detected background color (usually white/gray)
        if r > 240 and g > 240 and b > 240:
             new_data.append((0, 0, 0, 0))
        else:
             new_data.append(p)
             
    img.putdata(new_data)
    
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    img.save(OUTPUT)
    print(f"Final sticker saved: {OUTPUT}")

if __name__ == "__main__":
    make_transparent()

from PIL import Image
import os

INPUT = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_master_02_arigatou_green_v3_1767015918291.png"
OUTPUT = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_02_arigatou_final.png"

def extract_strict():
    if not os.path.exists(INPUT):
        print(f"Error: {INPUT} not found")
        return

    img = Image.open(INPUT).convert("RGBA")
    data = img.getdata()
    
    # Strict rule: Only remove background color. No character modification.
    # Background is #00FF00
    new_data = []
    # Using a very tight tolerance to ensure we only touch the background.
    # Since it's a solid generated color, a small range is enough.
    for p in data:
        r, g, b, a = p
        # Target #00FF00 exactly or very close
        if r < 10 and g > 245 and b < 10:
            # Fully transparent
            new_data.append((0, 0, 0, 0))
        else:
            # Keep as is. Absolute geometric preservation.
            new_data.append(p)
            
    img.putdata(new_data)
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    img.save(OUTPUT)
    print(f"Strict transparency completed: {OUTPUT}")

if __name__ == "__main__":
    extract_strict()

from PIL import Image
import os

INPUT = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_master_03_odaijini_green_v1_1767016390490.png"
OUTPUT = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_03_odaijini_final.png"

def extract_strict():
    if not os.path.exists(INPUT):
        print(f"Error: {INPUT} not found")
        return

    img = Image.open(INPUT).convert("RGBA")
    data = img.getdata()
    
    # Strict rule: Only remove background color (#00FF00). No character modification.
    new_data = []
    for p in data:
        r, g, b, a = p
        # Target #00FF00 exactly or very close
        if r < 10 and g > 245 and b < 10:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(p)
            
    img.putdata(new_data)
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    img.save(OUTPUT)
    print(f"Strict transparency completed: {OUTPUT}")

if __name__ == "__main__":
    extract_strict()

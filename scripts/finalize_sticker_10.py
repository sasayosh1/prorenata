import os
from PIL import Image

# Path configuration
INPUT_PATH = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_chibi_10_odaijini_v4_final_base_1767004937636.png"
OUTPUT_PATH = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_chibi_10_odaijini_v4.png"

def finalize_sticker():
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found")
        return
    
    img = Image.open(INPUT_PATH).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    # Threshold for white removal
    # We want to be careful not to remove the hair (which is silver-blonde, nearly white)
    # But the background is pure white.
    # Usually the AI white is (255, 255, 255)
    
    for item in data:
        r, g, b, a = item
        # If the pixel is very close to pure white (background)
        if r > 250 and g > 250 and b > 250:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Save
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    img.save(OUTPUT_PATH)
    print(f"Final Sticker Saved: {OUTPUT_PATH}")

if __name__ == "__main__":
    finalize_sticker()

from PIL import Image, ImageChops
import os

INPUT = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_sticker_02_morning_step1_green_1767013077372.png"
OUTPUT = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_sticker_02_morning_final.png"

def extract_transparency():
    if not os.path.exists(INPUT):
        print(f"Error: {INPUT} not found")
        return

    img = Image.open(INPUT).convert("RGBA")
    data = img.getdata()

    new_data = []
    # Target color: Solid Neon Green #00FF00
    target_r, target_g, target_b = 0, 255, 0
    threshold = 80 # Tolerance for slight variations

    for item in data:
        r, g, b, a = item
        # Calculate distance to neon green
        # We focus on G being high and R, B being low
        if g > 180 and r < 100 and b < 100:
            # Match! Make it transparent
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    
    # Optional: Smooth edges by checking neighbors if needed, 
    # but with #00FF00 and clean outlines, simple replacement is usually best.
    
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    img.save(OUTPUT)
    print(f"Transparency extraction completed: {OUTPUT}")

if __name__ == "__main__":
    extract_transparency()

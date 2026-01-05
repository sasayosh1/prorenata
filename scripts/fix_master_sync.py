from PIL import Image
import os

INPUT = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/uploaded_image_0_1767011488419.jpg"
OUTPUT = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_break_navy.png"
NAVY = (30, 45, 90)

def fix():
    img = Image.open(INPUT).convert("RGB")
    data = img.getdata()
    new_data = []
    for p in data:
        r, g, b = p
        if b > r * 1.5 and b > g * 1.1 and b > 100:
            new_data.append(NAVY)
        else:
            new_data.append(p)
    out = Image.new("RGB", img.size)
    out.putdata(new_data)
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    out.save(OUTPUT)
    print(f"Saved: {OUTPUT}")

if __name__ == "__main__":
    fix()

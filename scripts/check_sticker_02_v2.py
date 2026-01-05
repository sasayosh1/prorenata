from PIL import Image

IMG_PATH = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_sticker_02_morning_step1_green_1767006734516.png" # Wait, that was the OLD one!
# Correction: The LATEST image path is: 
# /Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_sticker_02_morning_step1_green_1767013077372.png

LATEST_IMG_PATH = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_sticker_02_morning_step1_green_1767013077372.png"

def check():
    img = Image.open(LATEST_IMG_PATH).convert("RGB")
    data = img.getdata()
    # Find navy
    navy_pixels = []
    for p in data:
        r, g, b = p
        if b > r * 1.2 and r < 100:
            navy_pixels.append(p)
    
    if navy_pixels:
        print(f"Navy color sample: {navy_pixels[len(navy_pixels)//2]}")
    else:
        print("Navy not found")

if __name__ == "__main__":
    check()

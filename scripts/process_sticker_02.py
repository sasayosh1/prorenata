from PIL import Image
import os

INPUT = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_sticker_02_morning_base_v2_1767012832213.png"
OUTPUT = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_sticker_02_morning.png"
MASTER = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_master_break_navy.png"

def process():
    img = Image.open(INPUT).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    # Simple checkerboard removal
    # Checkerboard usually has specific light gray/white pattern
    for p in data:
        r, g, b, a = p
        # Check if it's one of the common checkerboard colors
        if (r == g == b == 179) or (r == g == b == 153) or (r == g == b == 204) or (r > 250 and g > 250 and b > 250 and a > 0):
            # This is likely the background. But wait, white bits of the scrub are also white.
            # We need a smarter way. Since the character has a dark outline, we can use flood fill or 
            # assume the background starts from the edges.
            pass
            
    # Actually, a better way for these generated images is to detect the pattern.
    # But let's look at the navy first.
    navy_pixels = []
    for p in data:
        r, g, b, a = p
        if b > r * 1.5 and b > g * 1.1 and b > 50:
             navy_pixels.append(p)
    
    if navy_pixels:
        print(f"Sample Navy: {navy_pixels[0]}")
    else:
        print("No navy found!")

    # For transparency, I'll use a simple threshold for now and manual mask if needed.
    # But a safer way is to just use a solid color background in generation next time.
    # However, I already have this image.
    
    # RE-PROCESS: I will use a simple flood fill from (0,0) to remove background.
    from PIL import ImageDraw
    
    # First, let's just save as is for a moment to see if I should just use it.
    # Actually, the user's master image has a pure white background.
    # I'll just use the checkerboard colors to clear.
    
    clean_data = []
    for p in data:
        r, g, b, a = p
        # Checkerboard gray is often around 204 or 192.
        if abs(r-g) < 5 and abs(r-b) < 5 and (150 < r < 210):
             clean_data.append((0, 0, 0, 0))
        elif r > 245 and g > 245 and b > 245:
             # This could be the white background or the scrub.
             # If it's on the edge of the image (first/last few rows/cols), it's background.
             # This is a bit risky.
             clean_data.append(p)
        else:
             clean_data.append(p)
             
    img.putdata(clean_data)
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    img.save(OUTPUT)
    print(f"Transparency (Beta) Saved: {OUTPUT}")

if __name__ == "__main__":
    process()

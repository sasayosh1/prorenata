import os
from PIL import Image, ImageDraw, ImageFont

# Path configuration
INPUT_PATH = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_chibi_10_odaijini_base_1767004225079.png"
OUTPUT_PATH = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_chibi_10_odaijini.png"
FONT_PATH = "/System/Library/Fonts/Hiragino Sans GB.ttc" # Using standard Hiragino Sans GB

def process_sticker():
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found")
        return
    
    # 1. Background Removal
    img = Image.open(INPUT_PATH).convert("RGBA")
    
    # Pixel-by-pixel processing (No numpy dependency)
    data = img.getdata()
    new_data = []
    for item in data:
        r, g, b, a = item
        # Mask for gray-ish checkerboard (R, G, B are similar and not too dark/light)
        # Using a slight tolerance for "grayness"
        is_gray = abs(r - g) < 15 and abs(g - b) < 15 and abs(r - b) < 15
        if is_gray and (70 < r < 240):
            new_data.append((255, 255, 255, 0)) # Fully transparent
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # 2. Add Text "お大事に"
    draw = ImageDraw.Draw(img)
    text = "お大事に"
    ROUNDED_FONT = "/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc"
    
    # Find a good font size
    font_size = 130
    try:
        font = ImageFont.truetype(ROUNDED_FONT, font_size, index=0)
    except:
        font = ImageFont.truetype(FONT_PATH, font_size, index=0)
        
    # Scale text to fit width
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_width = right - left
    if text_width > img.width * 0.85:
        font_size = int(font_size * (img.width * 0.85 / text_width))
        font = ImageFont.truetype(ROUNDED_FONT, font_size, index=0)
        left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
        text_width = right - left
    
    x = (img.width - text_width) // 2
    y = 50 # Position at top
    
    # Extra Thick white outline for softer look
    outline_width = font_size // 6
    outline_color = (255, 255, 255, 255)
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx*dx + dy*dy <= outline_width*outline_width:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color)
                
    # Soft Brown Text
    text_color = (130, 80, 60, 255) # Slightly lighter warm brown for "soft" feel
    draw.text((x, y), text, font=font, fill=text_color)
    
    # Save
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    img.save(OUTPUT_PATH)
    print(f"Processed: {OUTPUT_PATH}")

if __name__ == "__main__":
    process_sticker()

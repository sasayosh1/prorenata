import os
from PIL import Image, ImageDraw, ImageFont

# Path configuration
INPUT_PATH = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/ae7e78b3-0d94-40f6-81cd-da2e43ec9fb8/sera_chibi_10_odaijini_v6_correct_style_green_1767005513498.png"
OUTPUT_PATH = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/sera_chibi_10_odaijini_v6.png"
ROUNDED_FONT = "/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc"

def process_sticker():
    if not os.path.exists(INPUT_PATH):
        print(f"Error: {INPUT_PATH} not found")
        return
    
    # 1. Chroma-key Background Removal (Neon Green)
    img = Image.open(INPUT_PATH).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        # Detect neon green background (High G, low R and B)
        # Using a safer detection: G is the dominant channel
        if g > r * 1.5 and g > b * 1.5 and g > 150:
            new_data.append((0, 0, 0, 0)) # Fully transparent
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # Optional: Small cleanup on edges?
    # For now, let's see how this looks.
    
    # 2. Add Text "お大事に"
    draw = ImageDraw.Draw(img)
    text = "お大事に"
    
    font_size = 140
    try:
        font = ImageFont.truetype(ROUNDED_FONT, font_size, index=0)
    except:
        font = ImageFont.load_default()
        
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_width = right - left
    x = (img.width - text_width) // 2
    y = 40 # Position at top
    
    # Stylized thick border
    border_w = font_size // 6
    for dx in range(-border_w, border_w + 1):
        for dy in range(-border_w, border_w + 1):
            if dx*dx + dy*dy <= border_w*border_w:
                draw.text((x+dx, y+dy), text, font=font, fill=(255, 255, 255, 255))
    
    # Main text color (Warm dark brown)
    draw.text((x, y), text, font=font, fill=(120, 60, 40, 255))
    
    # Save
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    img.save(OUTPUT_PATH)
    print(f"Sticker Refined and Saved: {OUTPUT_PATH}")

if __name__ == "__main__":
    process_sticker()

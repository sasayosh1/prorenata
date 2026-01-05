import os
from PIL import Image, ImageDraw, ImageFont

# Path configuration
BASE_DIR = "/Users/sasakiyoshimasa/prorenata"
INPUT_DIR = os.path.join(BASE_DIR, "public/etc")
OUTPUT_DIR = os.path.join(BASE_DIR, "public/LINEスタンプ")
FONT_PATH = "/System/Library/Fonts/Hiragino Sans GB.ttc"

STICKERS = [
    {
        "name": "sera_chibi_line_sorry.png",
        "image": "sera_5 - 編集済み.png",
        "text": "すみません",
        "position": "top"
    },
    {
        "name": "sera_chibi_line_waiting.png",
        "image": "sera_4 - 編集済み.png",
        "text": "お待たせしました",
        "position": "top"
    },
    {
        "name": "sera_chibi_line_greeting.png",
        "image": "sera_2 - 編集済み.png",
        "text": "よろしくお願いします！",
        "position": "top"
    }
]

def make_sticker(config):
    img_path = os.path.join(INPUT_DIR, config["image"])
    if not os.path.exists(img_path):
        print(f"Error: {img_path} not found")
        return
    
    img = Image.open(img_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    # Initial font size
    font_size = 80
    max_width = img.width * 0.9
    
    while font_size > 10:
        try:
            font = ImageFont.truetype(FONT_PATH, font_size, index=0)
        except:
            font = ImageFont.load_default()
            break
            
        left, top, right, bottom = draw.textbbox((0, 0), config["text"], font=font)
        text_width = right - left
        if text_width <= max_width:
            break
        font_size -= 5

    # Final text metrics
    left, top, right, bottom = draw.textbbox((0, 0), config["text"], font=font)
    text_width = right - left
    text_height = bottom - top
    
    x = (img.width - text_width) // 2
    y = 50 # Adjusted margin

    # Outline (White)
    outline_color = (255, 255, 255, 255)
    outline_width = max(2, font_size // 8) # Proportional outline
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx*dx + dy*dy <= outline_width*outline_width:
                draw.text((x + dx, y + dy), config["text"], font=font, fill=outline_color)

    # Main text (Soft pinkish brown)
    text_color = (90, 50, 40, 255)
    draw.text((x, y), config["text"], font=font, fill=text_color)
    
    # Save
    output_path = os.path.join(OUTPUT_DIR, config["name"])
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    img.save(output_path)
    print(f"Generated: {output_path}")

if __name__ == "__main__":
    for s in STICKERS:
        make_sticker(s)

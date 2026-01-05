from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

def replace_sticker_text(input_path, output_path):
    # Load original image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Load pixels for sampling
    pixels = img.load()
    
    # 1. Sample Background color from (0, 0)
    bg_color = pixels[0, 0]
    print(f"Sampled Background Color: {bg_color}")
    
    # 2. Clear the bottom text area
    # Original text is approx between y=750 and y=1024
    new_img = img.copy()
    draw = ImageDraw.Draw(new_img)
    
    # Draw a rectangle over the old text area with the background color
    # We stop slightly before the character's body if possible, 
    # but the character is mostly central. 
    # Let's clear the entire bottom stripe below Y=800.
    draw.rectangle([0, 800, width, height], fill=bg_color)
    
    # 3. Render New Text "やったー！"
    text = "やったー！"
    
    # Try to find a bold rounded font
    # Common Mac fonts: Hiragino Maru Gothic ProN, or generic bold ones
    font_paths = [
        "/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"
    ]
    
    font = None
    for path in font_paths:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, 150) # Large bold font
                break
            except:
                continue
    
    if not font:
        font = ImageFont.load_default()
        print("Warning: Default font used. Result might not look ideal.")

    # Calculate text position
    # Use center alignment
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    pos_x = (width - text_w) // 2
    pos_y = 800 + (height - 800 - text_h) // 2 - 20 # Center in the bottom area

    # Text Colors
    core_color = (79, 46, 30, 255) # Dark brown core color sampled from original
    border_color = (255, 255, 255, 255) # White border
    
    # Draw White Border (Outline)
    stroke_width = 15
    draw.text((pos_x, pos_y), text, font=font, fill=core_color, 
              stroke_width=stroke_width, stroke_fill=border_color)
    
    # Save result
    new_img.save(output_path)
    print(f"Surgically replaced text with 'やったー！'. Result saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/kyukei_no_bubble_v2.png"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/kyukei_yatta_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    replace_sticker_text(input_file, output_file)

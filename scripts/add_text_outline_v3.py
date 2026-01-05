from PIL import Image, ImageDraw, ImageFilter
import os

def process_sticker(input_path, output_path):
    # Load original image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # 1. Background Masking (Floodfill from corners)
    temp_img = img.copy()
    # Mask to isolate what is NOT background
    # Red for BG during floodfill
    ImageDraw.floodfill(temp_img, (0, 0), (255, 0, 0, 255), thresh=15)
    ImageDraw.floodfill(temp_img, (width-1, 0), (255, 0, 0, 255), thresh=15)
    ImageDraw.floodfill(temp_img, (0, height-1), (255, 0, 0, 255), thresh=15)
    ImageDraw.floodfill(temp_img, (width-1, height-1), (255, 0, 0, 255), thresh=15)

    temp_data = temp_img.getdata()
    alpha_data = []
    for item in temp_data:
        if item[0] == 255 and item[1] == 0 and item[2] == 0:
            alpha_data.append(0)
        else:
            alpha_data.append(255)
    
    content_mask = Image.new("L", (width, height), 0)
    content_mask.putdata(alpha_data)
    
    # Isolated character/text
    img_content = img.copy()
    img_content.putalpha(content_mask)
    
    # 2. Text-Specific Mask
    text_region_x_start = int(width * 0.7)
    text_mask = Image.new("L", (width, height), 0)
    text_mask.paste(content_mask.crop((text_region_x_start, 0, width, height)), (text_region_x_start, 0))
    
    # 3. Create Dual Border for Visibility
    # A. Outer Dark Rim (to make the white border visible on white)
    # 18px total thickness
    outer_rim_mask = text_mask.filter(ImageFilter.MaxFilter(19)) 
    
    # B. Inner White Border
    # 15px thickness
    white_border_mask = text_mask.filter(ImageFilter.MaxFilter(15))
    
    # 4. Composite
    final_img = Image.new("RGBA", (width, height), (255, 255, 255, 255)) # WHITE BG
    
    # Draw dark brown outer rim (matching text color #4F2E1E approx)
    dark_brown = (79, 46, 30, 255)
    dark_layer = Image.new("RGBA", (width, height), dark_brown)
    final_img.paste(dark_layer, (0, 0), outer_rim_mask)
    
    # Paste white border over it
    white_layer = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    final_img.paste(white_layer, (0, 0), white_border_mask)
    
    # Paste original character/text content
    final_img.alpha_composite(img_content)
    
    # Save
    final_img.save(output_path)
    print(f"Processed image with white BG and visible text border saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1767098115508.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/otsukaresama_white_bg_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    process_sticker(input_file, output_file)

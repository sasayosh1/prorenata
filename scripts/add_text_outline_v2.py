from PIL import Image, ImageDraw, ImageFilter, ImageChops
import os

def process_sticker(input_path, output_path):
    # Load image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # 1. Background Removal (Targeted floodfill)
    # The background is white (255, 255, 255)
    # Use floodfill to find the contiguous white background starting from corners
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(img)
    
    # We create a temporary copy to fill
    # Floodfill with 0 (transparent) starting from the corner
    # Since we want a mask, let's use a copy of the image and floodfill a unique color
    temp_img = img.copy()
    # We use a color that is likely not in the image for the background fill
    # Or better: use ImageDraw.floodfill on a mask
    mask = Image.new("L", (width, height), 255) # Start with all content
    
    # Heuristic: fill background from 4 corners
    # Tolerance helps with compression artifacts
    ImageDraw.floodfill(temp_img, (0, 0), (255, 0, 0, 255), thresh=10) # Red for BG
    ImageDraw.floodfill(temp_img, (width-1, 0), (255, 0, 0, 255), thresh=10)
    ImageDraw.floodfill(temp_img, (0, height-1), (255, 0, 0, 255), thresh=10)
    ImageDraw.floodfill(temp_img, (width-1, height-1), (255, 0, 0, 255), thresh=10)

    # Now anything Red in temp_img is background
    temp_data = temp_img.getdata()
    alpha_data = []
    for item in temp_data:
        if item[0] == 255 and item[1] == 0 and item[2] == 0:
            alpha_data.append(0)
        else:
            alpha_data.append(255)
    
    mask.putdata(alpha_data)
    
    # Create the transparent character image
    img.putalpha(mask)
    
    # 2. Text Outline
    # Text is vertical on the right
    text_region_x_start = int(width * 0.7)
    
    # Create a mask only for the text area
    text_alpha_mask = Image.new("L", (width, height), 0)
    text_alpha_mask.paste(mask.crop((text_region_x_start, 0, width, height)), (text_region_x_start, 0))
    
    # Dilate the text mask to create the outline
    # MaxFilter(15) creates a ~7-8px border
    outline_mask = text_alpha_mask.filter(ImageFilter.MaxFilter(15))
    
    # 3. Final Composition on Black Background
    final_img = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    
    # Draw white outline
    white_layer = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    final_img.paste(white_layer, (0, 0), outline_mask)
    
    # Paste original character (with mask)
    final_img.alpha_composite(img)
    
    # Save
    final_img.save(output_path)
    print(f"Processed image saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1767098115508.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/otsukaresama_black_bg_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    process_sticker(input_file, output_file)

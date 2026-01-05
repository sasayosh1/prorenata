from PIL import Image, ImageDraw
import os

def surgical_color_swap(input_path, output_path):
    # Load original image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Load pixels for sampling and calculation
    pixels = img.load()
    
    # 1. Sample Navy color from the top's side panel
    # In 'omatase' left image, navy is at approx (450, 680)
    # We'll pick a representative navy pixel
    target_navy = pixels[442, 682] 
    print(f"Sampled Navy Color: {target_navy}")
    
    # 2. Define the Pants Surgical Region
    # We use a mask to be EXTREMELY precise
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Pants polygon on the running pose
    # This covers the legs but STOPS before the shoes and stay WITHIN the body outlines
    pants_poly = [
        (406, 747), (555, 737), (585, 762), (680, 831), 
        (638, 922), (542, 893), (496, 911), (430, 942), 
        (374, 915), (410, 856)
    ]
    draw.polygon(pants_poly, fill=255)
    
    # 3. Execution (Pixel by Pixel)
    # We only touch pixels where mask == 255
    new_img = img.copy()
    new_img_pixels = new_img.load()
    
    count = 0
    for y in range(height):
        for x in range(width):
            if mask.getpixel((x, y)) == 255:
                r, g, b, a = pixels[x, y]
                # If pixel is white or light grey (the pants)
                # We use a threshold to avoid touching black outlines
                if r > 180 and g > 180 and b > 180:
                    new_img_pixels[x, y] = target_navy
                    count += 1
    
    # Save result
    new_img.save(output_path)
    print(f"Surgically modified {count} pixels. Result saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_0_1767150337991.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/omatase_final_navy_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    surgical_color_swap(input_file, output_file)

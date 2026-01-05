from PIL import Image, ImageFilter, ImageOps
import os

def add_white_outline(input_path, output_path):
    # Load original image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # 1. Sample Background color from (0, 0)
    bg_color = img.getpixel((0, 0))
    print(f"Sampled Background Color: {bg_color}")
    
    # 2. Create a mask of the foreground (character and text)
    # Background is (89, 89, 89), but we use a small threshold to be safe
    pixels = img.load()
    mask = Image.new("L", (width, height), 0)
    mask_pixels = mask.load()
    
    threshold = 5
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if abs(r - bg_color[0]) > threshold or abs(g - bg_color[1]) > threshold or abs(b - bg_color[2]) > threshold:
                mask_pixels[x, y] = 255
                
    # 3. Dilate the mask to create the outline
    # Outline thickness approx 12-15px
    outline_mask = mask.filter(ImageFilter.MaxFilter(15))
    
    # 4. Composite
    # Start with solid background
    final_img = Image.new("RGBA", (width, height), bg_color)
    
    # Paste white where the expanded mask is
    white_layer = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    final_img.paste(white_layer, (0, 0), outline_mask)
    
    # Paste the original image (foreground content) on top
    # Since the original image has the background baked in, we use the foreground mask
    final_img.paste(img, (0, 0), mask)
    
    # Save result
    final_img.save(output_path)
    print(f"Surgically added white outline. Result saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/kyukei_yatta_v1.png"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/kyukei_yatta_white_outline_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    add_white_outline(input_file, output_file)

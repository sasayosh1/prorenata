from PIL import Image, ImageFilter
import os

def add_sticker_outline(input_path, output_path):
    # Load original image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # 1. Create a mask of the foreground content
    # Assuming the background is solid black (#000000)
    # However, to be surgical, we isolate pixels that are NOT black
    pixels = img.load()
    mask = Image.new("L", (width, height), 0)
    mask_pixels = mask.load()
    
    # We use a small threshold to catch dark outlines but ignore the black BG
    threshold = 10 
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # If it's not near-black
            if r > threshold or g > threshold or b > threshold:
                mask_pixels[x, y] = 255
                
    # 2. Dilate the mask to create the white outline
    # Reference image has a fairly thick outline (~15-20px)
    outline_mask = mask.filter(ImageFilter.MaxFilter(17)) 
    
    # 3. Create the white layer
    white_layer = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    
    # 4. Composite
    # Start with a solid black background
    final_img = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    
    # Paste white where the expanded mask is
    final_img.paste(white_layer, (0, 0), outline_mask)
    
    # Paste the original image on top
    # We use the original mask to ensure only the character/text parts are pasted, 
    # but since the foreground has the same black BG, we can just composite the content
    # over the white border. 
    # Actually, pasting the original content over the border is sufficient.
    final_img.paste(img, (0, 0), mask)
    
    # Save result
    final_img.save(output_path)
    print(f"Surgically added character white outline. Result saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_0_1767152049005.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/yoroshiku_white_outline_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    add_sticker_outline(input_file, output_file)

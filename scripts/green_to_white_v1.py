from PIL import Image, ImageMath, ImageFilter
import os

def green_to_white(input_path, output_path):
    # Load image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # 1. Isolate Green Pixels
    # We'll use a mask where G is the dominant channel
    r, g, b, a = img.split()
    
    # Logic for lime green detecting: G > 100 and G > R*1.2 and G > B*1.2
    # ImageMath.eval is handy for channel logic
    # We want a mask that is 255 where it's green, 0 otherwise
    mask = ImageMath.eval("convert( (g > 80) & (g > r * 1.2) & (g > b * 1.2), 'L')", r=r, g=g, b=b)
    
    # Slightly dilate the mask to catch the anti-aliased green edges
    mask = mask.filter(ImageFilter.MaxFilter(5))
    
    # 2. Create a White Layer
    white_layer = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    
    # 3. Composite
    # Paste white where the green mask is
    final_img = img.copy()
    final_img.paste(white_layer, (0, 0), mask)
    
    # Note: If the text border was green, it's now white.
    # If the character border was green, it's now white.
    
    # Save result
    final_img.save(output_path)
    print(f"Refined sticker with white border saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1767126507374.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/odaijini_white_border_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    green_to_white(input_file, output_file)

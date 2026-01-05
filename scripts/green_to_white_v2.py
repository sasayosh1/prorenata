from PIL import Image
import os

def green_to_white(input_path, output_path):
    # Load image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Access pixels
    pixels = list(img.getdata())
    new_pixels = []
    
    for r, g, b, a in pixels:
        # Detect lime green: High Green, significantly higher than Red and Blue
        # Green is usually (0, 255, 0) or similar (e.g., 50, 255, 50)
        # We also want to catch the "yellow-green" anti-aliased edges
        if g > 70 and g > r * 1.1 and g > b * 1.1:
            # Change to white
            new_pixels.append((255, 255, 255, 255))
        else:
            # Keep original pixel
            new_pixels.append((r, g, b, a))
            
    img.putdata(new_pixels)
    
    # Save result
    img.save(output_path)
    print(f"Refined sticker with white border saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1767126507374.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/odaijini_white_border_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    green_to_white(input_file, output_file)

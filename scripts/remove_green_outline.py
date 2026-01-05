from PIL import Image, ImageFilter
import os

def remove_green_outline(input_path, output_path):
    # Load image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Access pixels
    pixels = img.getdata()
    new_pixels = []
    
    for r, g, b, a in pixels:
        # Detect lime green: High Green, Low Red/Blue
        # Green is usually (0, 255, 0) or similar.
        # We use a threshold: G is significantly higher than R and B.
        if g > 100 and g > r * 1.5 and g > b * 1.5:
            # Replace green with black
            new_pixels.append((0, 0, 0, 255))
        elif r < 20 and g < 20 and b < 20:
             # Already black background
            new_pixels.append((0, 0, 0, 255))
        else:
            # Keep original pixel
            new_pixels.append((r, g, b, a))
            
    img.putdata(new_pixels)
    
    # Optional: Slightly clean up any remaining green fringing using a mask
    # Actually, the direct pixel replacement is quite effective for this high-contrast image.
    
    # Save result
    img.save(output_path)
    print(f"Refined sticker (green removed) saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1767123063863.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/odaijini_refined_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    remove_green_outline(input_file, output_file)

from PIL import Image, ImageDraw
import os

def white_to_navy_pants(input_path, output_path):
    # Load image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # 1. Define targeted mask for pants
    # Pants are roughly in the bottom half, center-left to center-right
    # Excluding the white smoke at the bottom
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Coordinates for pants area (heuristic based on 'omatase' running pose)
    # The front leg and back leg area
    pants_polygon = [
        (400, 720), (550, 720), (600, 850), (450, 950), (360, 930), # Back leg (top to bottom)
        (580, 750), (680, 830), (630, 920), (520, 900)             # Front leg
    ]
    # Simple rectangle/polygon approach is risky for 100% preservation.
    # Better: Detect the white pixels specifically in the lower body region.
    
    pixels = img.load()
    new_pixels = []
    
    # Target navy color (sampled from scrub side panels in reference)
    navy_blue = (32, 49, 82, 255) # Approx dark navy
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Condition: Pixel is mostly white/grey AND in the lower body region
            # AND NOT part of the smoke (smoke is at the very bottom and right)
            # Y > 700 is a safe start for pants
            if y > 715 and y < 940 and x > 350 and x < 700:
                # If pixel is white or very light grey
                if r > 200 and g > 200 and b > 200:
                    # Change to navy
                    pixels[x, y] = navy_blue
            
    # Save result
    img.save(output_path)
    print(f"Refined sticker with navy pants saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1_1767149626845.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/omatase_navy_pants_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    white_to_navy_pants(input_file, output_file)

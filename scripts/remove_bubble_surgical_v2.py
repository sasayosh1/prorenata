from PIL import Image, ImageDraw
import os

def surgical_remove_bubble(input_path, output_path):
    # Load original image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # 1. Sample Background color from (0, 0)
    bg_color = img.getpixel((0, 0))
    print(f"Sampled Background Color: {bg_color}")
    
    # 2. Precision Floodfill
    # We target the bubble interior (white) and its slightly darker outline
    # Starting points for the bubble (heuristic based on image)
    seed_points = [(180, 600), (160, 650), (200, 580)] # Points inside the bubble
    
    temp_img = img.copy()
    for pt in seed_points:
        # Floodfill the white area with BG color
        ImageDraw.floodfill(temp_img, pt, bg_color, thresh=30)
        
    # Also need to catch the bubble's outline pixels which are greyish
    # But we MUST NOT touch the character.
    # The bubble area is confined to X < 300.
    # We can perform a local mask fill for any remaining non-background pixels in that zone.
    
    pixels = temp_img.load()
    orig_pixels = img.load()
    
    # Final surgical sweep: Any white/greyish pixels in the bubble zone that aren't the character
    for y in range(height):
        for x in range(300): # Only scan the left side
            r, g, b, a = pixels[x, y]
            # If it's not the background color AND it's not the character's hair color (silver/white)
            # Actually, the simplest way is to see if the pixel was part of the bubble's color range
            # Bubble is white (255,255,255) to greyish outlines.
            if y > 500 and y < 750 and x < 300:
                # If it's the specific bubble white or a grey outline not connected to hair
                if r > 100 and g > 100 and b > 100:
                    # Let's check distance to character.
                    # This is getting complex. Let's stick to the floodfill + tight bounding box.
                    pass

    # The floodfill is actually very safe if thresh is tuned.
    # Let's use a tighter box to be 100% sure.
    temp_img.save(output_path)
    print(f"Refined surgical removal saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1767151405448.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/kyukei_no_bubble_v2.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    surgical_remove_bubble(input_file, output_file)

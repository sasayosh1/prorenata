from PIL import Image, ImageDraw
import os

def remove_speech_bubble(input_path, output_path):
    # Load original image
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Load pixels for sampling
    pixels = img.load()
    
    # 1. Sample Background color from a corner (0, 0)
    bg_color = pixels[0, 0]
    print(f"Sampled Background Color: {bg_color}")
    
    # 2. Define the Speech Bubble Region
    # The bubble is on the left, approx mid-height.
    # We use a mask to fill only that area.
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Specific polygon for the speech bubble "ぷはー" and its tail
    # Bounding box is roughly (100, 530) to (280, 700)
    bubble_poly = [
        (90, 520), (280, 520), (280, 680), (260, 690), (240, 705), (100, 695)
    ]
    draw.polygon(bubble_poly, fill=255)
    
    # 3. Execution (Fill area with BG color)
    new_img = img.copy()
    new_img_draw = ImageDraw.Draw(new_img)
    
    # Fill the polygon with the sampled background color
    new_img_draw.polygon(bubble_poly, fill=bg_color)
    
    # 4. Refinement: Specifically for the "tail" that gets close to the hair
    # Tail approx (240, 680) -> (270, 705?) 
    # Let's ensure we don't accidentally cut into a hair outline if it's there.
    # Actually, let's use a very targeted fill.
    
    # Save result
    new_img.save(output_path)
    print(f"Surgically removed speech bubble. Result saved to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1767151405448.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/kyukei_no_bubble_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    remove_speech_bubble(input_file, output_file)

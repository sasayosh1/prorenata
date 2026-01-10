import sys
import os
from PIL import Image

def resize_and_crop(input_path, output_path, target_width=1200, target_height=630):
    try:
        img = Image.open(input_path)
        img_width, img_height = img.size
        
        # Calculate ratio to resize the image to at least the target dimensions
        width_ratio = target_width / img_width
        height_ratio = target_height / img_height
        resize_ratio = max(width_ratio, height_ratio)
        
        new_width = int(img_width * resize_ratio)
        new_height = int(img_height * resize_ratio)
        
        # Resize image using Resampling.LANCZOS
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Crop from the top (keep top, cut bottom per user request)
        # left, top, right, bottom
        left = (new_width - target_width) / 2
        top = 0 # Keep the top
        right = left + target_width
        bottom = top + target_height
        
        img = img.crop((left, top, right, bottom))
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save as PNG
        img.save(output_path, "PNG", quality=95)
        print(f"Successfully processed: {output_path} ({target_width}x{target_height})")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python crop_thumbnail.py <input_path> <output_path>")
        sys.exit(1)
    
    resize_and_crop(sys.argv[1], sys.argv[2])

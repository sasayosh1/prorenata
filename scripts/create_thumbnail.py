from PIL import Image
import sys
import os

def process_thumbnail(input_path, output_path, target_width=1280, target_height=670):
    try:
        img = Image.open(input_path)
        
        # Calculate aspect ratios
        target_ratio = target_width / target_height
        img_ratio = img.width / img.height
        
        # Determine resize dimensions
        if img_ratio > target_ratio:
            # Source is wider than target
            new_height = target_height
            new_width = int(new_height * img_ratio)
        else:
            # Source is taller or same aspect (resize by width)
            new_width = target_width
            new_height = int(new_width / img_ratio)
            
        img = img.resize((new_width, new_height), Image.LANCZOS)
        
        # Calculate crop box (Center)
        left = (new_width - target_width) / 2
        top = (new_height - target_height) / 2
        right = (new_width + target_width) / 2
        bottom = (new_height + target_height) / 2
        
        img = img.crop((left, top, right, bottom))
        img.save(output_path)
        print(f"Thumbnail saved to {output_path} ({target_width}x{target_height})")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_thumbnail.py <input> <output>")
        sys.exit(1)
        
    process_thumbnail(sys.argv[1], sys.argv[2])

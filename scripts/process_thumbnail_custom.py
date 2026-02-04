from PIL import Image, ImageChops
import sys
import os

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def process_image(input_path, output_path):
    img = Image.open(input_path)
    # Trim
    img = trim(img)
    
    # Resize and Center Crop to 1200x630
    target_ratio = 1200 / 630
    img_ratio = img.width / img.height
    
    if img_ratio > target_ratio:
        # Image is wider than target - resize by height
        new_height = 630
        new_width = int(new_height * img_ratio)
    else:
        # Image is taller than target - resize by width
        new_width = 1200
        new_height = int(new_width / img_ratio)
        
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Center Crop
    left = (new_width - 1200) / 2
    top = (new_height - 630) / 2
    right = (new_width + 1200) / 2
    bottom = (new_height + 630) / 2
    
    img = img.crop((left, top, right, bottom))
    img.save(output_path)
    print(f"Processed image saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_thumbnail_custom.py <input_path> <output_path>")
    else:
        process_image(sys.argv[1], sys.argv[2])

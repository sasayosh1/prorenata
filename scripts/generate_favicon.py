from PIL import Image, ImageDraw, ImageOps
import os
import sys

def create_circular_favicon(input_path, output_dir):
    try:
        img = Image.open(input_path).convert("RGBA")
        
        # 1. Crop to square (center)
        width, height = img.size
        min_dim = min(width, height)
        
        left = (width - min_dim) / 2
        top = (height - min_dim) / 2
        right = (width + min_dim) / 2
        bottom = (height + min_dim) / 2
        
        img = img.crop((left, top, right, bottom))
        
        # 2. Create circular mask
        mask = Image.new('L', (min_dim, min_dim), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, min_dim, min_dim), fill=255)
        
        # 3. Apply mask
        output = ImageOps.fit(img, mask.size, centering=(0.5, 0.5))
        output.putalpha(mask)
        
        # 4. Save as icon.png (192x192)
        icon_size = (192, 192)
        icon_img = output.resize(icon_size, Image.Resampling.LANCZOS)
        icon_path = os.path.join(output_dir, "icon.png")
        icon_img.save(icon_path, "PNG")
        print(f"Created {icon_path}")
        
        # 5. Save as favicon.ico (32x32)
        favicon_size = (32, 32)
        favicon_img = output.resize(favicon_size, Image.Resampling.LANCZOS)
        favicon_path = os.path.join(output_dir, "favicon.ico")
        favicon_img.save(favicon_path, format='ICO', sizes=[(32, 32)])
        print(f"Created {favicon_path}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Input image path (from artifacts)
    input_image = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/01888079-e1e7-4645-a113-1c41e5e601d8/uploaded_image_1764903245111.png"
    
    # Output directory (src/app based on list_dir)
    output_directory = "src/app"
    
    if not os.path.exists(input_image):
        print(f"Error: Input image not found at {input_image}")
        sys.exit(1)
        
    create_circular_favicon(input_image, output_directory)

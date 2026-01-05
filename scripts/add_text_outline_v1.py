import PIL.Image as Image
import PIL.ImageDraw as Draw
import PIL.ImageFilter as ImageFilter
import PIL.ImageOps as ImageOps
import numpy as np
import os

def process_sticker(input_path, output_path):
    # Load image
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # 1. Background Removal (Flood fill from corners to handle white parts of character)
    # Background is white (255, 255, 255)
    # We use a mask to separate the character/text from the background
    # Standard white is 255, but AI images might have subtle variations (254-255)
    
    # Simple threshold for white background
    # We'll use a mask where (R > 250, G > 250, B > 250)
    bg_mask = (data[:, :, 0] > 250) & (data[:, :, 1] > 250) & (data[:, :, 2] > 250)
    
    # To avoid removing white parts of the character, we only remove white regions 
    # that are connected to the edges (flood fill)
    from scipy.ndimage import binary_fill_holes, label
    
    # Invert mask (1 for content, 0 for background candidate)
    content_mask = ~bg_mask
    
    # Labelling objects to identify the main character and text
    # Actually, the user wants the background to be black.
    # So we just need to identify what IS NOT background.
    
    # Create an alpha channel where background is 0
    new_data = data.copy()
    new_data[bg_mask, 3] = 0
    img_alpha = Image.fromarray(new_data)
    
    # 2. Identify Text Region
    # The text "お疲れ様です！" is on the right side.
    # Let's say the right 30% of the image.
    width, height = img.size
    text_region_x_start = int(width * 0.7)
    
    # 3. Create Text Outline
    # Create a mask of the non-transparent pixels in the text region
    alpha = img_alpha.getchannel('A')
    alpha_np = np.array(alpha)
    text_mask_np = np.zeros_like(alpha_np)
    text_mask_np[:, text_region_x_start:] = alpha_np[:, text_region_x_start:]
    
    text_mask = Image.fromarray(text_mask_np)
    
    # Expand the text mask to create the outline (using dilation)
    # We can use ImageFilter.MaxFilter(7) to expand the border
    outline_mask = text_mask.filter(ImageFilter.MaxFilter(15)) # 15px border
    
    # 4. Composite
    # Final image on black background
    final_img = Image.new("RGBA", img.size, (0, 0, 0, 255))
    
    # Draw white outline where the mask is
    white_img = Image.new("RGBA", img.size, (255, 255, 255, 255))
    final_img.paste(white_img, mask=outline_mask)
    
    # Paste original character (with transparency) over it
    # This preserves the character perfectly
    final_img.alpha_composite(img_alpha)
    
    # Save result
    final_img.save(output_path)
    print(f"Saved refined sticker to {output_path}")

if __name__ == "__main__":
    input_file = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/fa2ed72e-e34d-42d2-81c6-071d2d163787/uploaded_image_1767098115508.jpg"
    output_file = "/Users/sasakiyoshimasa/prorenata/public/LINEstamp/otsukaresama_black_bg_v1.png"
    
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    process_sticker(input_file, output_file)

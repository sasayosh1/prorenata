#!/usr/bin/env python3
"""
Fix the Sera thumbnail image by cropping to 1200x630 (keeping top portion).
"""
from PIL import Image
import os
import sys
from utils.antigravity_paths import inbox_dir, unique_path

INPUT_PATH = os.environ.get('INPUT_PATH') or (sys.argv[1] if len(sys.argv) > 1 else '/Users/sasakiyoshimasa/.gemini/antigravity/brain/35c32c3e-2506-4991-8654-c757ee7a206f/uploaded_image_1_1764552588587.jpg')
OUTPUT_PATH = os.environ.get('OUTPUT_PATH') or (sys.argv[2] if len(sys.argv) > 2 else unique_path(os.path.join(inbox_dir("prorenata", "thumbnails"), 'sera_resignation_fixed_1200x630.jpg')))
TARGET_SIZE = (1200, 630)

def crop_and_resize_image():
    """
    Crop the square image to 16:9 (keeping top), then resize to 1200x630.
    """
    if not os.path.exists(INPUT_PATH):
        print(f"Error: Input file not found: {INPUT_PATH}")
        return
    
    try:
        with Image.open(INPUT_PATH) as img:
            print(f"Original image size: {img.size}")
            
            # Step 1: Crop to 16:9 aspect ratio (keeping top portion)
            width, height = img.size
            
            # Calculate 16:9 dimensions
            target_ratio = 16 / 9
            current_ratio = width / height
            
            if abs(current_ratio - target_ratio) < 0.01:
                # Already 16:9, just resize
                cropped_img = img
            else:
                # Need to crop
                # For 16:9, height should be width / (16/9) = width * 9/16
                target_height_for_width = int(width * 9 / 16)
                
                if target_height_for_width <= height:
                    # Crop vertically (keep top)
                    left = 0
                    right = width
                    top = 0
                    bottom = target_height_for_width
                    cropped_img = img.crop((left, top, right, bottom))
                    print(f"Cropped to: {cropped_img.size} (kept top portion)")
                else:
                    # Image is too tall, this shouldn't happen for square images
                    # but handle it anyway
                    target_width_for_height = int(height * 16 / 9)
                    left = (width - target_width_for_height) // 2
                    right = left + target_width_for_height
                    top = 0
                    bottom = height
                    cropped_img = img.crop((left, top, right, bottom))
                    print(f"Cropped to: {cropped_img.size} (centered horizontally)")
            
            # Step 2: Resize to target size
            final_img = cropped_img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
            print(f"Resized to: {final_img.size}")
            
            # Save the final image
            final_img.save(OUTPUT_PATH, quality=95)
            print(f"✓ Saved to: {OUTPUT_PATH}")
            
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    crop_and_resize_image()

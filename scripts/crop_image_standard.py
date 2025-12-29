#!/usr/bin/env python3
"""
Standard image cropping script for ProReNata project.
Crops images from 1024x1024 (or similar) to 1024x576 (16:9).
Keeps the top portion and cuts only from the bottom.
"""
from PIL import Image
import os
import sys
from utils.antigravity_paths import inbox_dir, unique_path

# Default configuration
DEFAULT_INPUT_DIR = '/Users/sasakiyoshimasa/.gemini/antigravity/brain'
DEFAULT_OUTPUT_DIR = inbox_dir("prorenata", "images")
TARGET_SIZE = (1024, 576)  # 16:9 aspect ratio

def crop_image(input_path, output_path=None, target_size=TARGET_SIZE):
    """
    Crop an image to the target size, keeping the top portion.
    
    Args:
        input_path: Path to the input image
        output_path: Path to save the cropped image (optional)
        target_size: Tuple of (width, height) for the target size
    
    Returns:
        Path to the output file if successful, None otherwise
    """
    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}")
        return None
    
    try:
        with Image.open(input_path) as img:
            width, height = img.size
            target_width, target_height = target_size
            
            # Calculate crop coordinates
            # Keep top portion, cut only from bottom
            left = 0
            right = width
            top = 0
            bottom = target_height
            
            # Validate crop coordinates
            if bottom > height:
                print(f"Warning: Image height ({height}) is less than target height ({target_height})")
                print("Image will be padded instead of cropped")
                # Create a new image with white background
                new_img = Image.new("RGB", target_size, (255, 255, 255))
                # Paste the original image at the top
                new_img.paste(img, (0, 0))
                cropped_img = new_img
            else:
                # Crop the image
                cropped_img = img.crop((left, top, right, bottom))
            
            # Generate output path if not provided
            if output_path is None:
                basename = os.path.basename(input_path)
                name, ext = os.path.splitext(basename)
                output_path = unique_path(os.path.join(DEFAULT_OUTPUT_DIR, f"{name}_cropped{ext}"))
            
            # Save the cropped image
            cropped_img.save(output_path)
            print(f"✓ Cropped image saved to: {output_path}")
            return output_path
            
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return None

def main():
    """Main function for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python crop_image_standard.py <input_path> [output_path]")
        print("Example: python crop_image_standard.py input.png output.png")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = crop_image(input_path, output_path)
    if result is None:
        sys.exit(1)

if __name__ == "__main__":
    main()

import sys
import os
# Add the parent directory to sys.path to allow importing from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.image_utils import create_circular_icon

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_image = sys.argv[1]
    else:
        # Default to the master source in the new asset directory
        input_image = "画像/thumbnail&top/favicon_source.png"
    
    output_directory = "src/app"
    
    if not os.path.exists(input_image):
        print(f"Error: Input image not found at {input_image}")
        print("Usage: python3 scripts/generate_favicon.py <input_image_path>")
        sys.exit(1)
        
    # Generate icon.png (192x192)
    create_circular_icon(input_image, os.path.join(output_directory, "icon.png"), size=(192, 192))
    
    # Generate favicon.ico (32x32)
    create_circular_icon(input_image, os.path.join(output_directory, "favicon.ico"), size=(32, 32))

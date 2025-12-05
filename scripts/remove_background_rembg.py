from rembg import remove
from PIL import Image
import sys
import os

def remove_background_rembg(input_path, output_path):
    try:
        print(f"Processing {input_path}...")
        img = Image.open(input_path)
        output = remove(img)
        output.save(output_path)
        print(f"Successfully removed background using rembg: {output_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Use the backup file as source to ensure we start from the original image
    input_file = "public/images/avatars/sera_thinking.png.bak"
    output_file = "public/images/avatars/sera_thinking.png"
    
    if not os.path.exists(input_file):
        print(f"Error: Backup file {input_file} not found. Cannot restore original.")
        # Fallback to current if backup missing (though risky if already processed)
        if os.path.exists(output_file):
             print("Using current file as input (backup missing).")
             input_file = output_file
        else:
             sys.exit(1)
            
    remove_background_rembg(input_file, output_file)

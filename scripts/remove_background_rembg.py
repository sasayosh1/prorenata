from rembg import remove
from PIL import Image
import sys
import os
from utils.antigravity_paths import inbox_dir, unique_path, assert_not_public_path

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
    input_file = sys.argv[1] if len(sys.argv) > 1 else "public/images/avatars/sera_thinking.png.bak"
    default_out = unique_path(os.path.join(inbox_dir("prorenata", "avatars"), "sera_thinking.png"))
    output_file = sys.argv[2] if len(sys.argv) > 2 else default_out
    assert_not_public_path(output_file)
    
    if not os.path.exists(input_file):
        print(f"Error: Backup file {input_file} not found. Cannot restore original.")
        # Fallback to current if backup missing (though risky if already processed)
        if os.path.exists(output_file):
             print("Using current file as input (backup missing).")
             input_file = output_file
        else:
             sys.exit(1)
            
    remove_background_rembg(input_file, output_file)

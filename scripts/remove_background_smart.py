import sys
import os
# Add the parent directory to sys.path to allow importing from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.image_utils import remove_background_smart

if __name__ == "__main__":
    input_file = "public/images/avatars/sera_thinking.png.bak"
    output_file = "public/images/avatars/sera_thinking.png"
    
    # Check if backup exists, otherwise try to use current file if it exists
    if not os.path.exists(input_file):
        if os.path.exists(output_file):
             print(f"Backup {input_file} not found. Using {output_file} as input.")
             input_file = output_file
        else:
             print(f"Error: Input file {input_file} not found.")
             sys.exit(1)

    success = remove_background_smart(input_file, output_file)
    if not success:
        sys.exit(1)

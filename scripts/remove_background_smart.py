import sys
import os
# Add the parent directory to sys.path to allow importing from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.image_utils import remove_background_smart
from utils.antigravity_paths import inbox_dir, unique_path, assert_not_public_path

if __name__ == "__main__":
    input_file = sys.argv[1] if len(sys.argv) > 1 else "public/images/avatars/sera_thinking.png.bak"
    default_out = unique_path(os.path.join(inbox_dir("prorenata", "avatars"), "sera_thinking.png"))
    output_file = sys.argv[2] if len(sys.argv) > 2 else default_out
    assert_not_public_path(output_file)
    
    # Check if backup exists, otherwise try to use current file if it exists
    if not os.path.exists(input_file):
        # If the output path exists (e.g., user passed an existing file), use it as input.
        if os.path.exists(output_file):
            print(f"Backup {input_file} not found. Using {output_file} as input.")
            input_file = output_file
        else:
            print(f"Error: Input file {input_file} not found.")
            print("Usage: python3 scripts/remove_background_smart.py <input_path> [output_path]")
            sys.exit(1)

    success = remove_background_smart(input_file, output_file)
    if not success:
        sys.exit(1)

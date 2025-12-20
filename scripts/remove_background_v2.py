import sys
import os

# Add the parent directory to sys.path to allow importing from utils
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'utils'))

from image_utils import remove_background_smart

def process_background(input_path, output_path):
    try:
        if not os.path.exists(input_path):
            print(f"Error: Input file {input_path} not found.")
            return False
            
        print(f"Processing {input_path}...")
        
        # Use the built-in smart removal with anti-leak dilation
        success = remove_background_smart(input_path, output_path, threshold=245, dilation_size=3)
        
        if success:
            print(f"Successfully saved to {output_path}")
            return True
        else:
            return False
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/remove_background_v2.py <input_path> <output_path>")
        sys.exit(1)
    
    input_p = sys.argv[1]
    output_p = sys.argv[2]
    
    if process_background(input_p, output_p):
        sys.exit(0)
    else:
        sys.exit(1)

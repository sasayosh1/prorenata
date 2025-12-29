from PIL import Image, ImageDraw
import sys
import os
from utils.antigravity_paths import inbox_dir, unique_path, assert_not_public_path

def remove_background_floodfill(input_path, output_path, threshold=240):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # Create a mask image initialized to black (0)
        mask = Image.new('L', (width, height), 0)
        draw = ImageDraw.Draw(mask)
        
        # We will flood fill the mask with white (255) starting from corners
        # But first we need a reference image to check colors against
        # Let's assume the background is white-ish.
        
        # Helper to check if a pixel is "background" (white-ish)
        def is_background(pixel):
            return pixel[0] > threshold and pixel[1] > threshold and pixel[2] > threshold

        # Custom flood fill because ImageDraw.floodfill doesn't support custom predicates easily
        # and we want to fill based on the *original* image color but draw on the *mask*.
        
        # Queue for BFS: (x, y)
        queue = []
        
        # Check corners
        corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
        for x, y in corners:
            if is_background(img.getpixel((x, y))):
                queue.append((x, y))
                mask.putpixel((x, y), 255) # Mark as background

        visited = set(queue)
        
        # Directions: Up, Down, Left, Right
        dirs = [(0, 1), (0, -1), (1, 0), (-1, 0)]
        
        while queue:
            cx, cy = queue.pop(0)
            
            for dx, dy in dirs:
                nx, ny = cx + dx, cy + dy
                
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        if is_background(img.getpixel((nx, ny))):
                            visited.add((nx, ny))
                            mask.putpixel((nx, ny), 255)
                            queue.append((nx, ny))

        # Now apply the mask to the alpha channel
        # Where mask is 255 (background), alpha should be 0
        # Where mask is 0 (foreground), alpha should remain (or be 255)
        
        datas = img.getdata()
        mask_datas = mask.getdata()
        newData = []
        
        for i in range(len(datas)):
            item = datas[i]
            is_bg = mask_datas[i] == 255
            
            if is_bg:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item) # Keep original pixel

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully removed background using flood fill: {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Use the backup file as source to avoid compounding errors
    input_file = sys.argv[1] if len(sys.argv) > 1 else "public/images/avatars/sera_thinking.png.bak"
    default_out = unique_path(os.path.join(inbox_dir("prorenata", "avatars"), "sera_thinking.png"))
    output_file = sys.argv[2] if len(sys.argv) > 2 else default_out
    assert_not_public_path(output_file)
    
    if not os.path.exists(input_file):
        print(f"Error: Backup file {input_file} not found. Cannot restore original.")
        print("Usage: python3 scripts/remove_background.py <input_path> [output_path]")
        sys.exit(1)
            
    remove_background_floodfill(input_file, output_file)

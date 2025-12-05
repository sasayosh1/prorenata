from PIL import Image
import sys
import os

def remove_background_smart(input_path, output_path, threshold=240, min_size=20):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # 1. Identify all "white" pixels
        white_pixels = set()
        for y in range(height):
            for x in range(width):
                r, g, b, a = img.getpixel((x, y))
                if r > threshold and g > threshold and b > threshold:
                    white_pixels.add((x, y))
        
        # 2. Find connected components of white pixels
        visited = set()
        components = []
        
        for px in white_pixels:
            if px not in visited:
                # Start BFS
                component = []
                queue = [px]
                visited.add(px)
                
                while queue:
                    cx, cy = queue.pop(0)
                    component.append((cx, cy))
                    
                    # Check neighbors
                    for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                        nx, ny = cx + dx, cy + dy
                        if (nx, ny) in white_pixels and (nx, ny) not in visited:
                            visited.add((nx, ny))
                            queue.append((nx, ny))
                
                components.append(component)
        
        # 3. Filter components
        # We want to remove components that are:
        # a) Connected to the border (Main background)
        # b) Larger than min_size (Trapped background)
        # We keep components that are small and not connected to border (Eye highlights)
        
        pixels_to_remove = set()
        
        for comp in components:
            is_border = False
            for x, y in comp:
                if x == 0 or x == width - 1 or y == 0 or y == height - 1:
                    is_border = True
                    break
            
            if is_border or len(comp) > min_size:
                for px in comp:
                    pixels_to_remove.add(px)
            else:
                print(f"Keeping small white component of size {len(comp)} at {comp[0]}")

        # 4. Apply transparency
        datas = img.getdata()
        newData = []
        for y in range(height):
            for x in range(width):
                if (x, y) in pixels_to_remove:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(img.getpixel((x, y)))
        
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully processed image. Removed {len(pixels_to_remove)} pixels.")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    input_file = "public/images/avatars/sera_thinking.png.bak"
    output_file = "public/images/avatars/sera_thinking.png"
    
    if not os.path.exists(input_file):
        print(f"Error: Backup file {input_file} not found.")
        # Try to use the current file if it exists, assuming it might be the flood-filled one
        # But flood-filled one has transparency already.
        # We need the ORIGINAL white background one.
        # If .bak is missing, we might be in trouble if we overwrote it with transparent version.
        # But wait, the flood filled version has transparent background.
        # The trapped parts are WHITE.
        # So we can actually run this on the *current* file (flood filled) too!
        # The transparent pixels won't be "white" (they are (255,255,255,0) usually or (0,0,0,0)).
        # Let's check alpha.
        if os.path.exists(output_file):
             print("Using current file as input.")
             input_file = output_file
        else:
             sys.exit(1)

    # If using the flood-filled image as input, the main background is already transparent.
    # So "white pixels" will only be the trapped ones (and eye highlights).
    # And they won't be connected to border (because border is transparent).
    # So the logic "is_border" might not trigger for trapped parts, but "len(comp) > min_size" WILL trigger.
    # So this script works for both original and partially-processed images!
    
    remove_background_smart(input_file, output_file)

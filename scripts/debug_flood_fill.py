from PIL import Image
import sys
import os

# Raw source
RAW_SOURCE = "/Users/sasakiyoshimasa/.gemini/antigravity/brain/01888079-e1e7-4645-a113-1c41e5e601d8/uploaded_image_1764898872638.png"
OUTPUT_PATH = "public/images/chibichara/sera_chibi_thinking.png"

def debug_and_fix(input_path, output_path, threshold=240):
    if not os.path.exists(input_path):
        print(f"Error: Input {input_path} not found")
        return

    print(f"Opening {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    print(f"Size: {width}x{height}")
    
    # Check corners
    corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    start_points = []
    
    print("Checking corners:")
    for x, y in corners:
        pixel = img.getpixel((x, y))
        is_bg = pixel[0] > threshold and pixel[1] > threshold and pixel[2] > threshold
        print(f"  ({x}, {y}): {pixel} -> Is Background? {is_bg}")
        if is_bg:
            start_points.append((x, y))
            
    if not start_points:
        print("Error: No background corners found! Threshold might be too high or image has no white border.")
        # Try finding *any* white pixel on the border
        print("Scanning border for white pixels...")
        for x in range(width):
            if x % 10 == 0: # sample
                px = img.getpixel((x, 0))
                if px[0] > threshold and px[1] > threshold and px[2] > threshold:
                    print(f"  Found white pixel at top border ({x}, 0): {px}")
                    start_points.append((x, 0))
                    break
        
    if not start_points:
        print("Failed to find starting point for flood fill.")
        return

    print(f"Starting flood fill from {len(start_points)} points...")
    
    # Flood Fill Logic
    mask = Image.new('L', (width, height), 0)
    queue = list(start_points)
    for p in start_points:
        mask.putpixel(p, 255)
        
    visited = set(start_points)
    dirs = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    
    count = 0
    while queue:
        cx, cy = queue.pop(0)
        count += 1
        
        for dx, dy in dirs:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited:
                    pixel = img.getpixel((nx, ny))
                    if pixel[0] > threshold and pixel[1] > threshold and pixel[2] > threshold:
                        visited.add((nx, ny))
                        mask.putpixel((nx, ny), 255)
                        queue.append((nx, ny))
                        
    print(f"Flood fill complete. Marked {len(visited)} pixels as background.")
    
    if len(visited) == 0:
        print("Warning: No pixels marked for removal!")
    
    # Apply mask
    datas = img.getdata()
    mask_datas = mask.getdata()
    newData = []
    for i in range(len(datas)):
        if mask_datas[i] == 255:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(datas[i])
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    debug_and_fix(RAW_SOURCE, OUTPUT_PATH)

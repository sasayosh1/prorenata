from PIL import Image, ImageDraw, ImageOps
import sys
import os

def remove_background_smart(input_path, output_path, threshold=240, min_size=20):
    """
    Removes background from an image using a smart connected-components approach.
    It removes large white areas (background + trapped background) while preserving
    small white details (like eye highlights).
    """
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # 1. Identify all "white" pixels
        white_pixels = set()
        for y in range(height):
            for x in range(width):
                r, g, b, a = img.getpixel((x, y))
                # Check for white-ish pixel
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
        pixels_to_remove = set()
        
        for comp in components:
            is_border = False
            for x, y in comp:
                if x == 0 or x == width - 1 or y == 0 or y == height - 1:
                    is_border = True
                    break
            
            # Remove if it touches the border (main background) OR is large enough (trapped background)
            if is_border or len(comp) > min_size:
                for px in comp:
                    pixels_to_remove.add(px)
            else:
                # Keep small isolated white components (highlights)
                pass

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
        print(f"Successfully processed image: {output_path}")
        return True

    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False

def create_circular_icon(input_path, output_path, size=None):
    """
    Crops an image to a circle and optionally resizes it.
    """
    try:
        img = Image.open(input_path).convert("RGBA")
        
        # Crop to square (center)
        width, height = img.size
        min_dim = min(width, height)
        
        left = (width - min_dim) / 2
        top = (height - min_dim) / 2
        right = (width + min_dim) / 2
        bottom = (height + min_dim) / 2
        
        img = img.crop((left, top, right, bottom))
        
        # Create circular mask
        mask = Image.new('L', (min_dim, min_dim), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, min_dim, min_dim), fill=255)
        
        # Apply mask
        output = ImageOps.fit(img, mask.size, centering=(0.5, 0.5))
        output.putalpha(mask)
        
        if size:
            output = output.resize(size, Image.Resampling.LANCZOS)
            
        # Infer format from extension
        fmt = None
        if output_path.lower().endswith('.ico'):
            fmt = 'ICO'
            # ICO requires sizes
            output.save(output_path, format=fmt, sizes=[(size[0], size[1])] if size else [(32, 32)])
        else:
            output.save(output_path, "PNG")
            
        print(f"Created circular icon: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error creating icon {input_path}: {e}")
        return False

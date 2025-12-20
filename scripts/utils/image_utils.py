from PIL import Image, ImageDraw, ImageOps
import sys
import os

def remove_background_smart(input_path, output_path, threshold=245, dilation_size=3):
    """
    Removes background using a boundary-closing anti-leak flood-fill approach.
    
    Steps:
    1. Identify all non-white pixels (character + text)
    2. Dilate this mask to close small gaps in outlines
    3. Flood-fill the background OUTSIDE this dilated mask
    4. Apply transparency only to the flood-filled area
    
    This ensures the flood-fill cannot "leak" through gaps into the character.
    """
    try:
        from PIL import ImageFilter, ImageOps
        
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # 1. Create a binary mask of non-white pixels (the character)
        character_mask = set()
        for y in range(height):
            for x in range(width):
                r, g, b, a = img.getpixel((x, y))
                # If pixel is NOT white, it's part of the character
                if r < threshold or g < threshold or b < threshold:
                    character_mask.add((x, y))
        
        # 2. Dilate the character mask to close small gaps
        # This creates a "protective barrier" around the character
        dilated_mask = set(character_mask)
        for _ in range(dilation_size):
            new_pixels = set()
            for px, py in dilated_mask:
                # Add all 8-connected neighbors
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        nx, ny = px + dx, py + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            new_pixels.add((nx, ny))
            dilated_mask = new_pixels
        
        # 3. Flood-fill from borders, avoiding the dilated character mask
        background_mask = set()
        visited = set()
        
        # Start from all border pixels that are NOT in the dilated mask
        seeds = []
        for x in range(width):
            for y in [0, height - 1]:
                if (x, y) not in dilated_mask:
                    seeds.append((x, y))
                    visited.add((x, y))
        for y in range(height):
            for x in [0, width - 1]:
                if (x, y) not in visited and (x, y) not in dilated_mask:
                    seeds.append((x, y))
                    visited.add((x, y))
        
        # BFS flood-fill
        queue = seeds
        while queue:
            cx, cy = queue.pop(0)
            background_mask.add((cx, cy))
            
            # Check 4-connectivity neighbors
            for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited and (nx, ny) not in dilated_mask:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
        
        # 4. Apply transparency only to background pixels
        newData = []
        for y in range(height):
            for x in range(width):
                if (x, y) in background_mask:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(img.getpixel((x, y)))
        
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully removed background with anti-leak protection: {output_path}")
        return True

    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        import traceback
        traceback.print_exc()
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

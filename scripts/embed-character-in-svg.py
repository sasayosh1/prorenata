import os
import base64
import argparse
from xml.dom import minidom
import xml.etree.ElementTree as ET

def embed_character(svg_path, image_path, output_path, position="bottom-right", scale=0.2):
    """
    Embeds a character image into an SVG file.
    
    Args:
        svg_path (str): Path to the source SVG file.
        image_path (str): Path to the PNG image to embed.
        output_path (str): Path to save the modified SVG.
        position (str): "bottom-right", "bottom-left", "top-right", "top-left"
        scale (float): Scale of the character relative to SVG height.
    """
    
    # 1. Read SVG to get dimensions
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        
        # Handle namespaces
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        ET.register_namespace('', ns['svg'])
        
        # Get viewBox or width/height
        viewBox = root.get('viewBox')
        if viewBox:
            _, _, width, height = map(float, viewBox.split())
        else:
            width = float(root.get('width').replace('px', ''))
            height = float(root.get('height').replace('px', ''))
            
    except Exception as e:
        print(f"Error parsing SVG: {e}")
        return

    # 2. Convert Image to Base64
    try:
        with open(image_path, "rb") as img_file:
            img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
            img_data_uri = f"data:image/png;base64,{img_base64}"
    except Exception as e:
        print(f"Error reading image: {e}")
        return

    # 3. Calculate Position and Size
    char_height = height * scale
    char_width = char_height # Assuming square-ish avatar for now, or preserve aspect ratio if possible
    
    padding = 20
    
    if position == "bottom-right":
        x = width - char_width - padding
        y = height - char_height - padding
    elif position == "bottom-left":
        x = padding
        y = height - char_height - padding
    elif position == "top-right":
        x = width - char_width - padding
        y = padding
    else: # top-left
        x = padding
        y = padding

    # 4. Create Image Element
    # Note: ET doesn't handle 'image' tag with href well without correct namespace for xlink
    # So we construct the string manually or use a different library. 
    # For simplicity/robustness with standard lib, let's append to the file content string.
    
    # Read SVG as string
    with open(svg_path, 'r') as f:
        svg_content = f.read()
        
    # Find insertion point (before </svg>)
    insert_pos = svg_content.rfind('</svg>')
    if insert_pos == -1:
        print("Invalid SVG: no closing tag")
        return

    image_tag = f'''
    <g id="embedded-character" transform="translate({x}, {y})">
        <image href="{img_data_uri}" width="{char_width}" height="{char_height}" />
    </g>
    '''
    
    new_content = svg_content[:insert_pos] + image_tag + svg_content[insert_pos:]
    
    with open(output_path, 'w') as f:
        f.write(new_content)
    
    print(f"Saved character-embedded SVG to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--svg", required=True, help="Input SVG path")
    parser.add_argument("--image", required=True, help="Input PNG image path")
    parser.add_argument("--output", required=True, help="Output SVG path")
    parser.add_argument("--pos", default="bottom-right", help="Position")
    
    args = parser.parse_args()
    
    embed_character(args.svg, args.image, args.output, args.pos)

import cv2
import numpy as np
import sys

def process_sticker(input_path, output_path, thickness=16):
    # Read the image
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Error: Could not read the image.")
        return

    # Standardize to BGR with white background if it was RGBA
    if img.shape[2] == 4:
        alpha = img[:, :, 3] / 255.0
        bg = np.ones_like(img[:, :, :3]) * 255
        img = (img[:, :, :3] * alpha[:, :, np.newaxis] + bg * (1 - alpha[:, :, np.newaxis])).astype(np.uint8)
    
    # Add a white padding border to prevent the character from touching the edge
    # This ensures cv2.findContours works properly around the entire character
    pad = 20
    img_padded = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(255, 255, 255))
    
    # Convert to grayscale and threshold to detect all non-white pixels
    gray = cv2.cvtColor(img_padded, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 245, 255, cv2.THRESH_BINARY_INV)
    
    # Find the external contours (this completely ignores internal white parts like eyes and clothes)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Draw filled contours to create a solid mask of the character and text
    core_mask = np.zeros_like(gray)
    cv2.drawContours(core_mask, contours, -1, 255, thickness=cv2.FILLED)
    
    # Create the thicker stroke mask (white border) using morphological dilation
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (thickness, thickness))
    stroke_mask = cv2.dilate(core_mask, kernel, iterations=1)
    
    # Smooth the stroke edge to make it look professional and anti-aliased
    stroke_mask = cv2.GaussianBlur(stroke_mask, (5, 5), 0)
    _, stroke_mask = cv2.threshold(stroke_mask, 127, 255, cv2.THRESH_BINARY)
    
    # Remove the padding to restore original dimensions
    core_mask = core_mask[pad:-pad, pad:-pad]
    stroke_mask = stroke_mask[pad:-pad, pad:-pad]
    
    # Construct the final RGBA transparent PNG
    final_rgba = np.zeros((img.shape[0], img.shape[1], 4), dtype=np.uint8)
    
    # 1. Apply the white stroke (where stroke_mask is 255)
    final_rgba[stroke_mask == 255] = [255, 255, 255, 255]
    
    # 2. Overlay the original image exactly inside the core mask over the white stroke
    final_rgba[core_mask == 255, :3] = img[core_mask == 255]
    final_rgba[core_mask == 255, 3] = 255
    
    # Save the output
    cv2.imwrite(output_path, final_rgba)
    print(f"Successfully processed to {output_path}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python process_line_sticker.py <input> <output>")
        sys.exit(1)
    process_sticker(sys.argv[1], sys.argv[2], thickness=16)

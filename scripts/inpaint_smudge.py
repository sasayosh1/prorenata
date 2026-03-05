import cv2
import numpy as np
import sys

def inpaint_smudge(input_path, output_path):
    img = cv2.imread(input_path, cv2.IMREAD_COLOR)
    if img is None:
        print("Error reading image")
        sys.exit(1)
        
    y_start, y_end = 400, 600
    x_start, x_end = 200, 440
    roi = img[y_start:y_end, x_start:x_end]
    
    b, g, r = cv2.split(roi)
    
    # Target dark blobs that are not black lines and not skin
    # Typically anime shading is a bit darker. Let's find anomalous dark blue/grey drops
    is_dark = (b > 40) & (b < 140) & (g > 40) & (g < 140) & (r > 40) & (r < 140)
    is_not_skin = b >= (r - 20)
    
    combined_mask = is_dark & is_not_skin
    mask_8u = (combined_mask * 255).astype(np.uint8)
    
    # Exclude lineart heavily
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, lineart = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV) # white where lineart is
    kernel_line = np.ones((5,5), np.uint8)
    lineart_dilated = cv2.dilate(lineart, kernel_line, iterations=1) # expand lineart protection
    
    mask_8u[lineart_dilated > 0] = 0
    
    # Morphological operations to clean up the mask and get only grouped smudge pixels
    kernel_morph = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask_8u = cv2.morphologyEx(mask_8u, cv2.MORPH_OPEN, kernel_morph)
    mask_8u = cv2.dilate(mask_8u, kernel_morph, iterations=2)
    
    # Apply seamless inpainting
    inpainted_roi = cv2.inpaint(roi, mask_8u, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    
    img[y_start:y_end, x_start:x_end] = inpainted_roi
    
    cv2.imwrite(output_path, img)
    print("Inpainting complete.")

if __name__ == '__main__':
    inpaint_smudge('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_1772637451381.png', 
               '/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_inpainted.png')

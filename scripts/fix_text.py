import cv2
import numpy as np
import sys

def fix_text(input_path, output_path):
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Error reading image")
        sys.exit(1)
        
    print(f"Image shape: {img.shape}")
    
    # Text is usually on the right side.
    # We want to erase the "!" which is at the bottom of the text column.
    # In a 640x640 image, text is around x: 500-600, y: 100-600.
    # The "!" is at the very bottom, likely y: 530-620
    
    # We can detect the dark brown color of the text.
    # BGR for the text is likely very dark brown (~ B:30, G:30, R:40)
    
    # Let's define the region where "!" is:
    # We'll just white-out a rectangle at the bottom right where the ! should be.
    # Then we will draw three small brown dots.
    
    y_start, y_end = 510, 630
    x_start, x_end = 500, 630
    
    roi = img[y_start:y_end, x_start:x_end]
    
    # Find the text color by looking at the darkest pixels in this ROI
    # Or just hardcode a typical dark brown color
    text_color = (45, 35, 35) # BGR
    if img.shape[2] == 4:
        text_color = (45, 35, 35, 255)
        
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(gray)
    if min_val < 100:
        # Get exact color from the darkest spot
        text_color = roi[min_loc[1], min_loc[0]]
        text_color = tuple(int(x) for x in text_color)

    # Erase everything dark in this ROI (turn to white)
    # The ! is dark. We will find contours of dark objects and fill them with white.
    _, thresh = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY_INV)
    
    # Fill the "!" with white
    roi[thresh == 255] = [255, 255, 255, 255] if img.shape[2] == 4 else [255, 255, 255]
    
    # Now draw three dots closely spaced.
    # Let's find the center X of the text column.
    # Assuming the text is centered around x=560.
    # Let's examine the column above the erased part to find the center x.
    gray_above = cv2.cvtColor(img[450:510, 500:630], cv2.COLOR_BGR2GRAY)
    _, thresh_above = cv2.threshold(gray_above, 120, 255, cv2.THRESH_BINARY_INV)
    M = cv2.moments(thresh_above)
    center_x = 560 # default fallback
    if M["m00"] != 0:
        center_x = int(M["m10"] / M["m00"]) + x_start
        
    print(f"Calculated text center X: {center_x}")
    
    # Draw "..." (three vertical dots, closely spaced)
    dot_radius = 4
    spacing = 12
    start_y = 560
    
    # Adjust for rounded rectangular strokes like handwriting
    # We will draw short thick lines or ellipses
    for i in range(3):
        cy = start_y + i * spacing
        cv2.ellipse(img, (center_x, cy), (6, 5), 0, 0, 360, text_color, -1)
        
    cv2.imwrite(output_path, img)
    print(f"Text edited and saved to {output_path}")

if __name__ == '__main__':
    fix_text('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_1772637451381.png', 
             '/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_fixed_text.png')

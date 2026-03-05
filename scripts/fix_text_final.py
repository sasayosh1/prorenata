import cv2
import numpy as np

def fix_text_final(input_path, output_path):
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    
    # Text color matching original text
    text_color = (45, 35, 35) # BGR
    if img.shape[2] == 4:
        text_color = (45, 35, 35, 255)
        
    # 'い' ends exactly at Y=533. '!' begins exactly at Y=548.
    # We will surgically paint a pure white box from Y=540 downwards to completely obliterate the '!' 
    # capturing all anti-aliased edges, without touching 'い'.
    img[540:630, 480:610] = [255, 255, 255, 255] if img.shape[2] == 4 else [255, 255, 255]
    
    # Calculate Center X of text column to draw the dots
    # 'い' is approximately at X=515 to X=580.
    # Let's verify center from row 480:530 (the 'い' character).
    roi_i = img[480:530, 500:600]
    gray_i = cv2.cvtColor(roi_i, cv2.COLOR_BGR2GRAY)
    _, thresh_i = cv2.threshold(gray_i, 180, 255, cv2.THRESH_BINARY_INV)
    M = cv2.moments(thresh_i)
    center_x = 550
    if M["m00"] != 0:
        center_x = int(M["m10"] / M["m00"]) + 500
        
    # Draw '...'
    start_y = 555
    spacing = 15
    for i in range(3):
        cy = start_y + i * spacing
        cv2.ellipse(img, (center_x, cy), (6, 5), 0, 0, 360, text_color, -1)
        
    cv2.imwrite(output_path, img)

if __name__ == '__main__':
    fix_text_final('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_1772637451381.png', 
                   '/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_fixed_text_final.png')

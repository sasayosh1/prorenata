import cv2
import numpy as np
import sys

def add_tears(input_path, output_path):
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Error reading image")
        sys.exit(1)
        
    print(f"Image shape: {img.shape}")
    
    # We will create an overlay and blend it.
    overlay = img.copy()
    
    # Tear color: light blue/cyan
    tear_color = (255, 230, 200) # BGR
    # If the image has alpha channel:
    if img.shape[2] == 4:
        tear_color = (255, 230, 200, 255)
        
    # Draw tears
    # Coordinates for left and right eyes (approximate for 640x640 chibi)
    # Left eye bottom: ~ (240, 340)
    # Right eye bottom: ~ (400, 360)
    
    # Left tear
    cv2.ellipse(overlay, (240, 340), (8, 15), 0, 0, 360, tear_color, -1)
    cv2.ellipse(overlay, (230, 350), (6, 12), -20, 0, 360, tear_color, -1)
    
    # Right tear
    cv2.ellipse(overlay, (400, 360), (8, 15), 0, 0, 360, tear_color, -1)
    cv2.ellipse(overlay, (410, 370), (6, 12), 20, 0, 360, tear_color, -1)
    
    # Draw Highlights on tears for a glossy anime look
    highlight_color = (255, 255, 255)
    if img.shape[2] == 4:
        highlight_color = (255, 255, 255, 255)
        
    cv2.circle(overlay, (243, 337), 2, highlight_color, -1)
    cv2.circle(overlay, (397, 357), 2, highlight_color, -1)

    # Blend the overlay with the original image using 0.7 alpha (so tears look semi-transparent like water)
    cv2.addWeighted(overlay, 0.7, img, 0.3, 0, img)
    
    cv2.imwrite(output_path, img)
    print(f"Added tears and saved to {output_path}")

if __name__ == '__main__':
    add_tears('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_1772637451381.png', 
              '/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_with_tears.png')

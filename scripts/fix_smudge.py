import cv2
import numpy as np
import sys

def fix_smudge(input_path, output_path):
    # Read image
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Error reading image")
        sys.exit(1)
        
    print(f"Image shape: {img.shape}")
    
    # We are looking for the dark smudge on the stomach.
    # The image is 640x640. The stomach is roughly around y: 400-600, x: 200-440
    # Let's inspect that region.
    y_start, y_end = 400, 600
    x_start, x_end = 200, 440
    roi = img[y_start:y_end, x_start:x_end]
    
    # The scrub is white. The smudge is dark.
    # We want to turn grey/black pixels in this region into white, 
    # EXCEPT for the very dark lineart (RGB < 40).
    # Let's say the smudge is RGB between (30,30,30) and (180,180,180).
    # We also want to protect skin/pinkish tones. So we only target neutral or bluish tones 
    # (B >= R - 20).
    
    lower_bound = np.array([40, 40, 40])
    upper_bound = np.array([160, 160, 160])
    
    # Extract BGR channels from ROI
    b = roi[:,:,0].astype(int)
    g = roi[:,:,1].astype(int)
    r = roi[:,:,2].astype(int)
    
    # Create boolean masks
    is_dark = (b >= 30) & (b <= 150) & (g >= 30) & (g <= 150) & (r >= 30) & (r <= 150)
    
    # Skin has much higher Red. Smudge is usually grey/blue.
    is_not_skin = b >= (r - 20)
    
    combined_mask = is_dark & is_not_skin
    
    # Convert bool to uint8 mask
    mask_8u = (combined_mask * 255).astype(np.uint8)
    
    # Dilate slightly to catch the edges of the smudge
    kernel = np.ones((3,3), np.uint8)
    mask_8u = cv2.dilate(mask_8u, kernel, iterations=1)
    
    # But wait, what if we dilated into the lineart?
    # Let's subtract any pixel that is < 30 intensity (lineart)
    is_lineart = (b < 40) & (g < 40) & (r < 40)
    mask_8u[is_lineart] = 0
    
    # Apply white paint to the mask
    roi[mask_8u == 255] = [255, 255, 255, 255] if img.shape[2] == 4 else [255, 255, 255]
    
    img[y_start:y_end, x_start:x_end] = roi
    
    cv2.imwrite(output_path, img)
    print(f"Fixed image saved to {output_path}")

if __name__ == '__main__':
    fix_smudge('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_1772637451381.png', 
               '/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_fixed.png')

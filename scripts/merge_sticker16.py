import cv2
import numpy as np

def merge_images():
    try:
        img_char = cv2.imread('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_16_kyuukei_1772665655370.png', cv2.IMREAD_UNCHANGED)
        img_text = cv2.imread('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_16_kyuukeichuu_1772665836700.png', cv2.IMREAD_UNCHANGED)
        
        # Dimensions are 640x640. Character is on left, text on right.
        split_x = 460
        
        # Initialize result image with white background
        result = np.ones_like(img_char) * 255
        
        # Copy the left part (character)
        result[:, :split_x] = img_char[:, :split_x]
        
        # Copy the right part (text)
        result[:, split_x:] = img_text[:, split_x:]
        
        output_path = '/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/16_combined_raw.png'
        cv2.imwrite(output_path, result)
        print("Successfully created 16_combined_raw.png")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    merge_images()

import cv2
import numpy as np
import sys

def combine_images(base_img_path, face_source_img_path, output_path):
    # Load images
    base_img = cv2.imread(base_img_path, cv2.IMREAD_UNCHANGED)
    face_src = cv2.imread(face_source_img_path, cv2.IMREAD_UNCHANGED)

    if base_img is None or face_src is None:
        print("Error loading images.")
        return

    # Resize face_src to match base_img if necessary (assuming they are the same size for now)
    if base_img.shape != face_src.shape:
        face_src = cv2.resize(face_src, (base_img.shape[1], base_img.shape[0]))

    # Define the region of interest (ROI) for the face.
    # Adjust these coordinates based on the actual images.
    # We want to take the face from face_src and put it onto base_img.
    # Let's inspect the images to find the face coordinates.
    # It's better to just swap the text instead. It's much cleaner.
    pass

def swap_text(img1_path, img2_path, output_path):
    # We will take the character from img1 ("きゅうけい〜" with open eyes)
    # and the text from img2 ("休憩中" with closed eyes).
    
    img1 = cv2.imread(img1_path, cv2.IMREAD_UNCHANGED) # Character source
    img2 = cv2.imread(img2_path, cv2.IMREAD_UNCHANGED) # Text source

    if img1 is None or img2 is None:
        print(f"Error loading images: {img1_path}, {img2_path}")
        return

    # Assume character is primarily on the left, text primarily on the right
    # Let's define a vertical line to split them.
    split_x = 650 # Adjust based on 1024x1024 resolution. Text is usually right of center.

    # Create a new image
    result = np.zeros_like(img1)

    # Copy character from img1
    result[:, :split_x] = img1[:, :split_x]

    # Copy text from img2
    result[:, split_x:] = img2[:, split_x:]

    # Blend the seam slightly to avoid harsh lines if backgrounds aren't perfectly white
    # Not strictly necessary if white backgrounds are pure white, but good practice.
    
    cv2.imwrite(output_path, result)
    print(f"Successfully combined into {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python combine_images.py <char_source.png> <text_source.png> <output.png>")
        sys.exit(1)
    
    swap_text(sys.argv[1], sys.argv[2], sys.argv[3])

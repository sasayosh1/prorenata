import cv2
import numpy as np
import sys

def fix_text_smart(input_path, output_path):
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    
    # Text column is roughly x: 480 to 620
    # Let's find the exact Y where "!" starts by looking at row intensity profile
    x_start, x_end = 480, 620
    gray = cv2.cvtColor(img[:, x_start:x_end], cv2.COLOR_BGR2GRAY)
    
    # We want to find the gap between "い" and "!"
    # Dark pixels are text. 
    dark_pixels = gray < 200
    row_sums = np.sum(dark_pixels, axis=1)
    
    # We expect text to be below y=100 and above y=630
    # Let's look from bottom up (y=630 down to y=400)
    # The "!" is the lowest text.
    # The "い" is above it.
    # The gap is a sequence of rows with row_sums == 0.
    
    lowest_text_y = -1
    for y in range(630, 400, -1):
        if row_sums[y] > 2:
            lowest_text_y = max(lowest_text_y, y)
            
    gap_y = -1
    # Find the gap above the lowest text
    in_text = False
    for y in range(lowest_text_y, 400, -1):
        if row_sums[y] > 2:
            in_text = True
        elif row_sums[y] == 0 and in_text:
            # We found a gap! But wait, '!' has a gap between the line and the dot.
            # So the first gap going up is the '!''s internal gap.
            # We need to keep going up until we find the next text (the line of '!'), 
            # and then the next gap above that!
            pass
            
    # Better approach: Find all contiguous text blocks in Y
    blocks = []
    current_block = []
    for y in range(400, 630):
        if row_sums[y] > 1:
            current_block.append(y)
        elif len(current_block) > 0:
            blocks.append((current_block[0], current_block[-1]))
            current_block = []
    if len(current_block) > 0:
        blocks.append((current_block[0], current_block[-1]))
        
    print(f"Found text blocks (y_start, y_end): {blocks}")
    
    # The "!" consists of the last two blocks (line and dot), or possibly one if they touch.
    # The "い" is the block before that.
    # Let's just define the cut-off Y as the space exactly 5 pixels above the top of the "!" line.
    # Looking at typical Japanese layout, the "!" is the final character.
    # It probably starts around y=550.
    # Let's just erase everything in x: 480-620 that is BELOW y=545 !
    # We will verify this by printing the blocks.
    
    # If the second to last block ends around 535, and the last block starts around 550, then y=545 is perfect.
    
    # Let's assume cut_y = 545 for erasing.
    # We will completely overwrite that region with white.
    cut_y = 540
    
    # Wait, let's find the exact cut_y from blocks.
    # Find the block that represents "い". It should be the large block before the "!"
    # "!" is usually broken into 2 blocks. "い" might be 1 block.
    # Let's just erase y > 538.
    
    # To be safe, let's just use y=538 to 640 as the clear zone.
    # Make sure we don't cut "い" bottom arcs.
    print(img.shape)
    
    # Erase the area where "!" is (overwrite with pure white)
    img[542:640, 500:620] = [255, 255, 255] # assuming BGR
    
    # Draw "..." 
    # Get color
    text_color = (45, 35, 35)
    center_x = 550
    start_y = 555
    spacing = 15
    for i in range(3):
        cy = start_y + i * spacing
        cv2.ellipse(img, (center_x, cy), (6, 5), 0, 0, 360, text_color, -1)
        
    cv2.imwrite(output_path, img)
    print("Fixed text smart!")

if __name__ == '__main__':
    fix_text_smart('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_1772637451381.png', 'test_out.png')

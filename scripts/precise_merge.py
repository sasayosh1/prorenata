import cv2
import numpy as np

# Load original generated images (white bg)
char_img = cv2.imread('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_16_kyuukei_1772665655370.png', cv2.IMREAD_COLOR)
text_img = cv2.imread('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_16_kyuukeichuu_1772665836700.png', cv2.IMREAD_COLOR)

if char_img is None or text_img is None:
    print("Error loading images")
    exit(1)

# We want the character from char_img.
gray_c = cv2.cvtColor(char_img, cv2.COLOR_BGR2GRAY)
_, mask_c = cv2.threshold(gray_c, 240, 255, cv2.THRESH_BINARY_INV)

num_labels_c, labels_c, stats_c, centroids_c = cv2.connectedComponentsWithStats(mask_c, connectivity=8)

# Find the largest component which is likely the character
largest_label_c = 1 + np.argmax(stats_c[1:, cv2.CC_STAT_AREA])

char_mask = np.zeros_like(mask_c)
for i in range(1, num_labels_c):
    # Include the main character and any small details like hair or cup that are on the left side
    c_x = centroids_c[i][0]
    # In these 1024x1024 stickers, character is usually in x < 750, text is x > 750
    if c_x < 750:
        char_mask[labels_c == i] = 255

# Same for text image
gray_t = cv2.cvtColor(text_img, cv2.COLOR_BGR2GRAY)
_, mask_t = cv2.threshold(gray_t, 240, 255, cv2.THRESH_BINARY_INV)
num_labels_t, labels_t, stats_t, centroids_t = cv2.connectedComponentsWithStats(mask_t, connectivity=8)

text_mask = np.zeros_like(mask_t)
for i in range(1, num_labels_t):
    # Text components are usually on the right side
    c_x = centroids_t[i][0]
    if c_x >= 750:
        text_mask[labels_t == i] = 255

# Combine
result_img = np.ones_like(char_img) * 255
result_img[char_mask == 255] = char_img[char_mask == 255]
result_img[text_mask == 255] = text_img[text_mask == 255]

cv2.imwrite('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_16_merged.png', result_img)
print("Successfully merged into sticker_16_merged.png")

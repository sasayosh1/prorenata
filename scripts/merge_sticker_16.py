import cv2
import numpy as np

# Load original pure-white background images
img1 = cv2.imread('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_16_kyuukei_1772665655370.png')
img2 = cv2.imread('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_16_kyuukeichuu_1772665836700.png')

result = np.ones_like(img1) * 255

# Extract character from img1
gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
_, thresh1 = cv2.threshold(gray1, 240, 255, cv2.THRESH_BINARY_INV)
num_labels1, labels1, stats1, centroids1 = cv2.connectedComponentsWithStats(thresh1, connectivity=8)

for i in range(1, num_labels1):
    # Keep components whose centroid is left of x=750 (the character)
    if centroids1[i][0] < 720:
        mask = (labels1 == i)
        result[mask] = img1[mask]

# Extract text from img2
gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
_, thresh2 = cv2.threshold(gray2, 240, 255, cv2.THRESH_BINARY_INV)
num_labels2, labels2, stats2, centroids2 = cv2.connectedComponentsWithStats(thresh2, connectivity=8)

for i in range(1, num_labels2):
    # Keep components whose centroid is right of x=720 (the text)
    if centroids2[i][0] > 720:
        mask = (labels2 == i)
        result[mask] = img2[mask]

cv2.imwrite('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_16_merged.png', result)
print("Merge complete.")

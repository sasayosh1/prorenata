import cv2
import numpy as np

img = cv2.imread('/Users/sasakiyoshimasa/.gemini/antigravity/brain/dd33d08e-9ae7-470f-baeb-870e7b043e7f/sticker_05_gomennasai_v3_1772637451381.png', cv2.IMREAD_UNCHANGED)
roi = img[400:640, 500:620]
gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)

num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(thresh, connectivity=8)

comps = []
for i in range(1, num_labels):
    if stats[i, cv2.CC_STAT_AREA] > 20:
        top = stats[i, cv2.CC_STAT_TOP] + 400
        bottom = stats[i, cv2.CC_STAT_TOP] + stats[i, cv2.CC_STAT_HEIGHT] + 400
        comps.append((top, bottom))

comps.sort(key=lambda x: x[1], reverse=True)
print("Components (top, bottom) in global Y:")
for c in comps:
    print(c)

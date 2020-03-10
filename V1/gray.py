import cv2

im = cv2.imread("./hp_cover.jpg")
gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
cv2.imwrite("./hp_gray.jpg", gray)

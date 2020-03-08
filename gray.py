import cv2

im = cv2.imread("./ref.jpg")
gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
cv2.imwrite("./ref_gray.jpg", gray)

# Planar Homography Estimation Running in WASM
Demo on laptop                    |  Demo on iPhone
:--------------------------------:|:-------------------------:
![PC demo](./demos/demo_pc.gif)   |  ![phone demo](./demos/demo_iphone.gif)

## Pipeline
1. Pass image from video stream as an array from JavaScript to WASM program. Turn image to grayscale.
2. Find homography matrix by creating and matching ORB descriptor keypoints from reference image to video frame.
3. Take those descriptor points from the video frame and track them using Lucas-Kanade tracking algorithm.
4. Find 2d affine transform ```T``` of descriptor points from one frame to the next and update homography matrix. ```H = T * H```
5. Pass homography matrix and warped corner points back to JavaScript and warp iframe element with homography matrix.
6. If homography matrix becomes invalid or at most 1/3 of tracked descriptor points are lost, repeat step 2.

## Building
Run:
```
git clone https://github.com/opencv/opencv.git
```

Follow the instructions to build OpenCV with WebAssembly support here: [https://docs.opencv.org/master/d4/da1/tutorial_js_setup.html](https://docs.opencv.org/master/d4/da1/tutorial_js_setup.html)

Then, run:
```
./build.sh
```

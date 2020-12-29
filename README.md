# Planar Homography Estimation and Image Tracking Running in WASM

Demo on laptop                    |  Demo on iPhone
:--------------------------------:|:-------------------------:
![PC demo](./demos/demo_pc.gif)   |  ![phone demo](./demos/demo_iphone.gif)

## Try it out

Try it out here (tap the screen to enable and disable tracking):

[https://edwardlu2018.github.io/wasm-ar/](https://edwardlu2018.github.io/wasm-ar/)

Reference image [here](https://github.com/EdwardLu2018/wasm-ar/blob/master/html/ref.jpg?raw=1).

## Pipeline

1. Pass image from video stream as an array from JavaScript to WASM program. Turn image to grayscale.
2. Find homography matrix by creating and matching ORB descriptor keypoints from reference image to video frame.
3. Take those descriptor points from the video frame and track them using Lucas-Kanade tracking algorithm.
4. Find 2d affine transform ```T``` of descriptor points from one frame to the next and update homography matrix. ```H = T * H```
5. Pass homography matrix and warped corner points back to JavaScript and warp iframe element with homography matrix.
6. If homography matrix becomes invalid or at most 1/3 of tracked descriptor points are lost, repeat step 2.

## Building

You will need git, cmake, and python installed.

The first step is to download and install emsdk (version 1.39.16 is recommended):
```shell
git clone https://github.com/emscripten-core/emsdk
cd emsdk
./emsdk update
./emsdk install 1.39.16
./emsdk activate 1.39.16
```

Next, you need opencv with WebAssembly support.

Instead of building opencv, you can use opencv-em: https://gist.github.com/kalwalt/a5fb9230f21b9e39f6fbc872cf20c376
```shell
curl --location "https://github.com/webarkit/opencv-em/releases/download/0.0.3/opencv-em-4.5.0-alpha-rc1.zip" -o opencv-em.zip
unzip -o opencv-em.zip -d opencv
cp -avr opencv/build_wasm/opencv ./
rm opencv-em.zip
```

OR

You can build opencv_js manually (make sure emsdk is installed!): https://docs.opencv.org/master/d4/da1/tutorial_js_setup.html
```shell
git clone https://github.com/opencv/opencv.git
cd opencv
python ./platforms/js/build_js.py build_wasm --build_wasm
```
The python script will build the static and the WASM lib in the build_wasm folder.

Then, run:
```shell
./build.sh
```

# Planar homography running in WASM

Demo on PC                        |  Demo on iPhone
:--------------------------------:|:-------------------------:
![PC demo](./demos/demo_pc.gif)   |  ![phone demo](./demos/demo_iphone.gif)

## How to compile OpenCV and OpenCV-Contrib to WASM
```
git clone https://github.com/opencv/opencv.git
git clone https://github.com/opencv/opencv_contrib.git
```
In ```<path to opencv>/opencv/platforms/js/build_js.py```, add 
```"-DOPENCV_EXTRA_MODULES_PATH=<path to opencv_contrib>/opencv_contrib/modules",``` to ```get_cmake_cmd()``` function

Then, follow the instructions to build WebAssembly from https://docs.opencv.org/master/d4/da1/tutorial_js_setup.html 

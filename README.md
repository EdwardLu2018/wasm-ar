# Web-Based AR Image Tracking with WebAssembly

Real-time planar image tracking running entirely in the browser. No native apps, no plugins, no server-side processing. Uses WebAssembly (OpenCV compiled to WASM), WebGL2 for GPU-accelerated preprocessing, and Web Workers for off-main-thread computation.

Works on desktop and mobile browsers with camera access.

Demo on laptop                    |  Demo on iPhone
:--------------------------------:|:-------------------------:
![PC demo](./media/demo_pc.gif)   |  ![phone demo](./media/demo_iphone.gif)

## Try it out

Try the live demo in your browser:

[https://edwardlu2018.github.io/wasm-ar/](https://edwardlu2018.github.io/wasm-ar/)

Point your camera at the [reference image](https://github.com/EdwardLu2018/wasm-ar/blob/master/html/ref.jpg?raw=1). If the overlay positioning looks off, look away briefly and point back at the image to re-detect.

## How it works

Everything runs client-side in the browser:

1. **WebGL2 GPU shader** converts the camera video frame to grayscale on the main thread
2. Grayscale pixel data is sent to a **Web Worker** running an **OpenCV WASM** module
3. **ORB feature detection** matches keypoints from the reference image to the video frame and computes a homography matrix
4. Frame-to-frame tracking uses **Lucas-Kanade optical flow** for smooth, fast updates without re-detecting every frame
5. The homography matrix is passed back to JavaScript via `postMessage` and used to warp an HTML element (iframe) with a CSS `matrix3d` transform
6. When tracking is lost (invalid homography or too few tracked points), ORB detection runs again automatically

### Web technologies used

| Technology | Role |
|-----------|------|
| **WebAssembly** | Runs OpenCV (ORB, optical flow, homography) at near-native speed |
| **WebGL2** | GPU-accelerated grayscale conversion with async PBO readback |
| **Web Workers** | Keeps WASM computation off the main thread for smooth 60fps rendering |
| **getUserMedia** | Accesses device camera (front or back) |
| **CSS matrix3d** | Applies the computed homography as a projective transform on HTML elements |

## Building

### Prerequisites

- git
- python3
- make
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)

### Install Emscripten

```shell
git clone https://github.com/emscripten-core/emsdk
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

### Build OpenCV for WebAssembly

```shell
git clone https://github.com/opencv/opencv.git
python3 opencv/platforms/js/build_js.py opencv/build_wasm --build_wasm
```

### Build and Run

```shell
npm install
npm run build
npm run serve
```

Then open `http://localhost:8000/html/` in your browser.

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build WASM and JS bundle |
| `npm run build:wasm` | Build WASM module only |
| `npm run build:js` | Build JS bundle only |
| `npm run dev` | Watch mode (JS only) |
| `npm run serve` | Start local dev server |
| `npm run clean` | Remove build artifacts |

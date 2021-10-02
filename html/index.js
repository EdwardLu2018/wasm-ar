var stats = null;
var arElem = null;

var wasmARSource = new WasmAR.ImageTrackerSource();
wasmARSource.setOptions({
    width: 1280,
    height: 720,
});

var overlayCanvas = document.createElement("canvas");
overlayCanvas.id = "overlay";
overlayCanvas.style.position = "absolute";
overlayCanvas.style.top = "0px";
overlayCanvas.style.left = "0px";
overlayCanvas.width = wasmARSource.options.width;
overlayCanvas.height = wasmARSource.options.height;

var imageTracker = new WasmAR.ImageTracker(wasmARSource);
imageTracker.init();

function transformElem(h, elem) {
    // column major order
    let transform = [h[0], h[3], 0, h[6],
                     h[1], h[4], 0, h[7],
                      0  ,  0  , 1,  0  ,
                     h[2], h[5], 0, h[8]];
    transform = "matrix3d("+transform.join(",")+")";
    elem.style["-ms-transform"] = transform;
    elem.style["-webkit-transform"] = transform;
    elem.style["-moz-transform"] = transform;
    elem.style["-o-transform"] = transform;
    elem.style.transform = transform;
    elem.style.display = "block";
}

function drawImage(corners) {
    var overlayCtx = overlayCanvas.getContext("2d");

    overlayCtx.beginPath();
        overlayCtx.lineWidth = 3;
        overlayCtx.strokeStyle = "blue";
        overlayCtx.moveTo(corners[0].x, corners[0].y);
        overlayCtx.lineTo(corners[1].x, corners[1].y);
        overlayCtx.lineTo(corners[2].x, corners[2].y);
        overlayCtx.lineTo(corners[3].x, corners[3].y);
        overlayCtx.lineTo(corners[0].x, corners[0].y);
    overlayCtx.stroke();
}

window.addEventListener("onWasmARInit", (e) => {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);

    document.body.appendChild(e.detail.source);
    document.body.appendChild(overlayCanvas);
    // document.body.appendChild(imageTracker.preprocessor.canvas);

    arElem = document.getElementById("arElem");
    arElem.style["transform-origin"] = "top left"; // default is center
    arElem.style.zIndex = 2;

    const refIm = document.getElementById("refIm");
    // imageTracker.addRefIm(refIm, refIm.width, refIm.height);

    resize();
    tick();
});

function tick() {
    stats.update();
    imageTracker.preprocessor.getPixels().then((imageData) => {
        imageTracker.findHomography(imageData);
    });
    requestAnimationFrame(tick)
}

window.addEventListener("onWasmARHomography", (e) => {
    const H = e.detail.H;
    const corners = e.detail.corners;
    if (arElem) {
        drawImage(corners);
        transformElem(H, arElem);
    }
});

function resize() {
    wasmARSource.resize(window.innerWidth, window.innerHeight);
    wasmARSource.copyDimensionsTo(overlayCanvas);
}

window.addEventListener("resize", (e) => {
    resize();
});

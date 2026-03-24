var stats = null;
var arElem = null;
var loading = null;

const width = 640;
const height = 480;

var wasmARSource = new WasmAR.ImageTrackerSource({
    width: width,
    height: height,
});

var overlayCanvas = document.createElement("canvas");
overlayCanvas.id = "overlay";
overlayCanvas.style.position = "absolute";
overlayCanvas.style.top = "0px";
overlayCanvas.style.left = "0px";
overlayCanvas.style.zIndex = 9999;
overlayCanvas.width = width;
overlayCanvas.height = height;

// Wrapper div for the AR element
// Stays at frame resolution internally; CSS scale() stretches it to match the video
var arWrapper = document.createElement("div");
arWrapper.id = "arWrapper";
arWrapper.style.position = "absolute";
arWrapper.style.top = "0px";
arWrapper.style.left = "0px";
arWrapper.style.width = width + "px";
arWrapper.style.height = height + "px";
arWrapper.style.overflow = "visible";
arWrapper.style.transformOrigin = "top left";
arWrapper.style.zIndex = 9999;

var imageTracker = new WasmAR.ImageTracker(wasmARSource);

// Wait for DOM before accessing elements and starting
window.addEventListener("DOMContentLoaded", () => {
    loading = document.getElementById("loading");
    loading.textContent = "Starting camera...";
    imageTracker.init();
});

function transformElem(h, elem) {
    // column major order, raw homography in frame resolution space
    let transform = [h[0], h[3], 0, h[6],
                     h[1], h[4], 0, h[7],
                      0  ,  0  , 1,  0  ,
                     h[2], h[5], 0, h[8]];
    elem.style.transform = "matrix3d(" + transform.join(",") + ")";
    elem.style.display = "block";
}

function drawImage(corners) {
    var overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

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
    // Hide loading
    if (loading) loading.className = "hide";

    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);

    document.body.appendChild(e.detail.source);
    document.body.appendChild(overlayCanvas);

    arElem = document.getElementById("arElem");
    arElem.style["transform-origin"] = "top left";

    arWrapper.appendChild(arElem);
    document.body.appendChild(arWrapper);

    const refIm = document.getElementById("refIm");
    imageTracker.addRefIm(refIm, refIm.width, refIm.height);

    resize();
    tick();
});

var processing = false;
function tick() {
    if (!processing) {
        processing = true;
        wasmARSource.getPixels().then((imageData) => {
            imageTracker.findHomography(imageData);
            processing = false;
        });
    }
    stats.update();
    requestAnimationFrame(tick);
}

window.addEventListener("onWasmARHomography", (e) => {
    const H = e.detail.H;
    const corners = e.detail.corners;
    if (arElem) {
        drawImage(corners);
        transformElem(H, arElem);
    }
});

window.addEventListener("onWasmARStatus", (e) => {
    if (loading) loading.textContent = e.detail.message;
});

window.addEventListener("onWasmARNotFound", () => {
    var overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    if (arElem) arElem.style.display = "none";
});

function resize() {
    // Let the source compute cover-style video dimensions from native aspect ratio
    wasmARSource.resize(window.innerWidth, window.innerHeight);

    // Read what the source actually computed
    var video = wasmARSource.video;
    var cssW = parseFloat(video.style.width);
    var cssH = parseFloat(video.style.height);
    var ml = video.style.marginLeft;
    var mt = video.style.marginTop;

    // Overlay canvas: internal frame resolution, CSS matches video
    overlayCanvas.style.width = cssW + "px";
    overlayCanvas.style.height = cssH + "px";
    overlayCanvas.style.marginLeft = ml;
    overlayCanvas.style.marginTop = mt;

    // AR wrapper: stays frame resolution, scale to match video CSS dimensions
    var sx = cssW / width;
    var sy = cssH / height;
    arWrapper.style.transform = "scale(" + sx + "," + sy + ")";
    arWrapper.style.marginLeft = ml;
    arWrapper.style.marginTop = mt;
}

// Handle both resize and orientation change
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => {
    setTimeout(resize, 100);
});

var width = window.innerWidth;
var height = window.innerHeight;

var arElem = null;

var stats = null;
var grayscale = null;

var videoCanvas = null;
var overlayCanvas = null;
var videoSource = null;

var worker = null;
var imageData = null;

var loadingPopUp = null;

function initStats() {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
}

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

function clearOverlayCtx() {
    const overlayCtx = overlayCanvas.getContext("2d");
    overlayCtx.clearRect( 0, 0, width, height );
}

function drawCorners(corners) {
    const overlayCtx = overlayCanvas.getContext("2d");
    clearOverlayCtx();

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = "blue";
    overlayCtx.lineWidth = 3;

    // [x1,y1,x2,y2,x3,y3,x4,y4]
    overlayCtx.moveTo(corners[0], corners[1]);
    overlayCtx.lineTo(corners[2], corners[3]);
    overlayCtx.lineTo(corners[4], corners[5]);
    overlayCtx.lineTo(corners[6], corners[7]);
    overlayCtx.lineTo(corners[0], corners[1]);

    overlayCtx.stroke();
}

function tick() {
                console.log(991);
    stats.begin();
                console.log(992);

    imageData = grayscale.getFrame();
                console.log(993);
    const videoCanvasCtx = videoCanvas.getContext("2d");
                console.log(994);
    videoCanvasCtx.drawImage(
        videoSource, 0, 0, width, height
    );

    stats.end();

    requestAnimationFrame(tick);
}

function createRefImMsg() {
    const refIm = document.getElementById("refIm");
    let refGrayscale = new WasmAR.GrayScaleMedia(refIm, refIm.width, refIm.height);
    return {
        type: "refIm",
        imagedata: refGrayscale.getFrame(),
        width: refIm.width,
        height: refIm.height
    }
}

function onInit(source) {
    videoSource = source;

    worker = new Worker("../js/img-tracker.worker.js");
    worker.postMessage({ type: "init", width: width, height: height });

    worker.onmessage = function (e) {
        var msg = e.data;
        switch (msg.type) {
            case "loaded": {
                worker.postMessage(createRefImMsg());
                break;
            }
            case "refImLoaded": {
                arElem = document.getElementById("arElem");
                arElem.style["transform-origin"] = "top left"; // default is center
                arElem.style.zIndex = 2;

                loadingPopUp.className = "hide"
                process();
                break;
            }
            case "result": {
                const result = msg.result;
                arElem.style.display = "block";
                transformElem(result.H, arElem);
                drawCorners(result.corners);
                process();
                break;
            }
            case "not found": {
                clearOverlayCtx();
                arElem.style.display = "none";
                process();
            }
            default: {
                break;
            }
        }
    }

    tick();
}

function process() {
    if (imageData) {
        worker.postMessage({ type: 'process', imagedata: imageData });
    }
}

window.onload = () => {
    function setVideoStyle(elem) {
        elem.style.position = "absolute";
        elem.style.top = 0;
        elem.style.left = 0;
    }

    var video = document.createElement("video");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    // document.body.appendChild(video);

    videoCanvas = document.createElement("canvas");
    setVideoStyle(videoCanvas);
    videoCanvas.id = "video-canvas";
    videoCanvas.width = width;
    videoCanvas.height = height;
    document.body.appendChild(videoCanvas);

    overlayCanvas = document.createElement("canvas");
    setVideoStyle(overlayCanvas);
    overlayCanvas.id = "overlay";
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    overlayCanvas.style.zIndex = 1;
    document.body.appendChild(overlayCanvas);

    loadingPopUp = document.getElementById("loading");
    loadingPopUp.className = "show";

    grayscale = new WasmAR.GrayScaleMedia(video, width, height);
    grayscale.requestStream()
        .then(source => {
            initStats();
            onInit(source);
        })
        .catch(err => {
            console.warn("ERROR: " + err);
        });
}

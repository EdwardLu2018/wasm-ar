import { GrayScale } from "./grayscale.js"
import { ImageTracker } from "./imageTracker.js"

let width = window.innerWidth;
let height = window.innerHeight;

let shouldTrack = false;

let arElem = null;
let refIm = null;

let frames = 0;
let stats = null;
let grayscale = null;
let tracker = null;

let overlayCanv = null;

function initStats() {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
}

function toggleTracking() {
    shouldTrack = !shouldTrack;
    if (arElem) {
        if (shouldTrack) {
            // arElem.style.display = "block";
        }
        else {
            clearOverlayCtx(overlayCanv.getContext("2d"));
            arElem.style.display = "none";
        }
    }
}
window.addEventListener("touchstart", toggleTracking);
window.addEventListener("mousedown", toggleTracking);

function setVideoStyle(elem) {
    elem.style.position = "absolute";
    elem.style.top = 0;
    elem.style.left = 0;
}

function setupVideo(setupCallback) {
    return new Promise((resolve, reject) => {
        let video = document.createElement("video");
        video.setAttribute("autoplay", "");
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        // document.body.appendChild(video);

        let canvas = document.createElement("canvas");
        canvas.style.zIndex = -1;
        setVideoStyle(canvas);
        document.body.appendChild(canvas);

        grayscale = new GrayScale(video, width, height, canvas);
        grayscale.requestStream()
            .then(() => {
                overlayCanv = document.createElement("canvas");
                setVideoStyle(overlayCanv);
                overlayCanv.id = "overlay";
                overlayCanv.width = width;
                overlayCanv.height = height;
                overlayCanv.style.zIndex = 0;
                document.body.appendChild(overlayCanv);
                resolve();
            })
            .catch(err => {
                console.warn("ERROR: " + err);
                reject();
            });
    });
}

function clearOverlayCtx(overlayCtx) {
    if (!overlayCanv) return;
    overlayCtx.clearRect(
        0, 0,
        width,
        height
    );
}

function drawCorners(corners) {
    if (!overlayCanv) return;
    const overlayCtx = overlayCanv.getContext("2d");
    clearOverlayCtx(overlayCtx);

    overlayCtx.beginPath();
    overlayCtx.strokeStyle = "blue";
    overlayCtx.lineWidth = 2;

    // [x1,y1,x2,y2...]
    overlayCtx.moveTo(corners[0], corners[1]);
    overlayCtx.lineTo(corners[2], corners[3]);
    overlayCtx.lineTo(corners[4], corners[5]);
    overlayCtx.lineTo(corners[6], corners[7]);
    overlayCtx.lineTo(corners[0], corners[1]);

    overlayCtx.stroke();
}

function processVideo() {
    stats.begin();

    const frame = grayscale.getFrame();
    if (frame && shouldTrack) {
        let res;
        if (++frames % 60 == 0) { // reset tracking every 60 frames in case tracking gets lost
            res = tracker.resetTracking(frame, width, height);
        }
        else {
            res = tracker.track(frame, width, height);
        }

        if (res.valid) {
            tracker.transformElem(res.H, arElem);
            drawCorners(res.corners);
        }
        else {
            clearOverlayCtx(overlayCanv.getContext("2d"));
            arElem.style.display = "none";
        }
    }

    stats.end();

    requestAnimationFrame(processVideo);
}

function createRefIm() {
    refIm = document.getElementById("refIm");
    let refGrayscale = new GrayScale(refIm, refIm.width, refIm.height, null);
    return refGrayscale.getFrame();
}

window.onload = () => {
    tracker = new ImageTracker(width, height, () => {
        initStats();
        setupVideo()
            .then(() => {
                tracker.init(createRefIm(), refIm.width, refIm.height);

                arElem = document.getElementById("arElem");
                arElem.style["transform-origin"] = "top left"; // default is center
                arElem.style.zIndex = 1;

                const instructionsPopUp = document.getElementById("instructions");
                instructions.className = "show";
                setTimeout(() => { instructions.className = "hide"; }, 5000);

                requestAnimationFrame(processVideo);
            });
    });
}

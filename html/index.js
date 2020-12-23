import { ImageTracker } from "./imageTracker.js"

let width = window.innerWidth;
let height = window.innerHeight;

let frames = 0;

function initStats() {
    window.stats = new Stats();
    window.stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
}

function toggleTracking() {
    window.shouldTrack = !window.shouldTrack;
    if (window.arElem) {
        if (window.shouldTrack) {
            window.arElem.style.display = "block";
        }
        else {
            clearOverlayCtx(window.overlayCanv.getContext("2d"));
            window.arElem.style.display = "none";
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

function setupVideo(displayVid, displayOverlay, setupCallback) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Browser does not support getUserMedia!");
        return;
    }

    window.videoElem = document.createElement("video");
    window.videoElem.setAttribute("autoplay", "");
    window.videoElem.setAttribute("muted", "");
    window.videoElem.setAttribute("playsinline", "");
    // document.body.appendChild(window.videoElem);

    let vidWidth = window.orientation ? width : height;
    let vidHeight = window.orientation ? height : width;

    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: { ideal: vidWidth },
            height: { ideal: vidHeight },
            aspectRatio: { ideal: vidWidth / vidHeight },
            facingMode: "environment",
        }
    })
    .then(stream => {
        window.videoElem.srcObject = stream;
        window.videoElem.onloadedmetadata = e => {
            window.videoElem.play();
        };
    })
    .catch(err => {
        console.warn("ERROR: " + err);
    });

    window.videoCanv = document.createElement("canvas");
    setVideoStyle(window.videoCanv);
    window.videoCanv.style.zIndex = -1;
    if (displayVid) {
        window.videoCanv.width = width;
        window.videoCanv.height = height;
        document.body.appendChild(window.videoCanv);
    }

    if (displayOverlay) {
        window.overlayCanv = document.createElement("canvas");
        setVideoStyle(window.overlayCanv);
        window.overlayCanv.width = width;
        window.overlayCanv.height = height;
        window.overlayCanv.style.zIndex = 0;
        document.body.appendChild(window.overlayCanv);
    }

    if (setupCallback != null) {
        setupCallback();
    }
}

function getFrame() {
    const videoCanvCtx = window.videoCanv.getContext("2d");
    videoCanvCtx.drawImage(
        window.videoElem,
        0, 0,
        width,
        height
    );

    return videoCanvCtx.getImageData(0, 0, width, height).data;
}

function clearOverlayCtx(overlayCtx) {
    if (!window.overlayCanv) return;
    overlayCtx.clearRect(
        0, 0,
        width,
        height
    );
}

function drawCorners(corners) {
    if (!window.overlayCanv) return;
    const overlayCtx = window.overlayCanv.getContext("2d");
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
    window.stats.begin();

    const frame = getFrame();
    if (window.shouldTrack) {
        let res;
        if (++frames % 120 == 0) { // reset tracking every 120 frames in case tracking gets lost
            res = window.tracker.resetTracking(frame, width, height);
        }
        else {
            res = window.tracker.track(frame, width, height);
        }

        if (res.valid) {
            window.tracker.transformElem(res.H, window.arElem);
            drawCorners(res.corners);
        }
        else {
            clearOverlayCtx(window.overlayCanv.getContext("2d"));
            window.arElem.style.display = "none";
        }
    }

    window.stats.end();

    requestAnimationFrame(processVideo);
}

function createRefIm() {
    const refIm = document.getElementById("refIm");
    const canv = document.createElement("canvas");
    const ctx = canv.getContext("2d");
    canv.width = refIm.width; canv.height = refIm.height;
    ctx.drawImage(refIm, 0, 0);
    return ctx.getImageData(0, 0, refIm.width, refIm.height).data;
}

window.onload = function() {
    window.tracker = new ImageTracker(() => {
        initStats();
        setupVideo(true, true, () => {
            window.tracker.init(createRefIm(), refIm.width, refIm.height);

            window.arElem = document.getElementById("arElem");
            window.arElem.style["transform-origin"] = "top left"; // default is center
            window.arElem.style.zIndex = 1;

            const instructionsPopUp = document.getElementById("instructions");
            instructions.className = "show";
            setTimeout(() => { instructions.className = "hide"; }, 5000);

            requestAnimationFrame(processVideo);
        });
    });
}

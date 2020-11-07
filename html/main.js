let width = Math.min(window.innerWidth, window.innerHeight);

function initStats() {
    window.stats = new Stats();
    window.stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
}

function setVideoStyle(elem) {
    elem.style.position = "absolute";
    elem.style.top = 0;
    elem.style.left = 0;
}

function setupVideo(displayVid, displayOverlay, setupCallback) {
    window.videoElem = document.createElement("video");
    window.videoElem.setAttribute("autoplay", "");
    window.videoElem.setAttribute("muted", "");
    window.videoElem.setAttribute("playsinline", "");

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
    })
    .then(stream => {
        const videoSettings = stream.getVideoTracks()[0].getSettings();
        window.videoElem.srcObject = stream;
        window.videoElem.play();
    })
    .catch(function(err) {
        console.log("ERROR: " + err);
    });

    window.videoCanv = document.createElement("canvas");
    setVideoStyle(window.videoCanv);
    window.videoCanv.style.zIndex = -1;
    if (displayVid) {
        document.body.appendChild(window.videoCanv);
    }

    if (displayOverlay) {
        window.overlayCanv = document.createElement("canvas");
        setVideoStyle(window.overlayCanv);
        window.overlayCanv.style.zIndex = 0;
        document.body.appendChild(window.overlayCanv);
    }

    window.videoElem.addEventListener("canplay", function(e) {
        window.width = width;
        window.height = window.videoElem.videoHeight / (window.videoElem.videoWidth / window.width);

        window.videoElem.setAttribute("width", window.width);
        window.videoElem.setAttribute("height", window.height);

        window.videoCanv.width = window.width;
        window.videoCanv.height = window.height;

        if (displayOverlay) {
            window.overlayCanv.width = window.width;
            window.overlayCanv.height = window.height;
        }

        if (setupCallback != null) {
            setupCallback();
        }
    }, false);
}

function getFrame() {
    const videoCanvCtx = window.videoCanv.getContext("2d");
    videoCanvCtx.drawImage(
        window.videoElem,
        0, 0,
        window.width,
        window.height
    );

    return videoCanvCtx.getImageData(0, 0, window.width, window.height).data;
}

function clearOverlayCtx(overlayCtx) {
    if (!window.overlayCanv) return;
    overlayCtx.clearRect(
        0, 0,
        window.width,
        window.height
    );
}

function drawBbox(corners) {
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

window.addEventListener("touchstart", function() {
    window.tracker.shouldTrack = !window.tracker.shouldTrack;
});

window.addEventListener("mousedown", function() {
    window.tracker.shouldTrack = !window.tracker.shouldTrack;
});

function processVideo() {
    window.stats.begin();

    const frame = getFrame();
    const [valid, h, warped] = window.tracker.track(frame, window.width, window.height);
    if (valid) {
        window.tracker.performTransform(h, window.arElem);
        drawBbox(warped);
    }
    else {
        clearOverlayCtx(window.overlayCanv.getContext("2d"));
        window.arElem.style.display = "none";
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
            requestAnimationFrame(processVideo);
        });
    });
}

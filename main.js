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

function drawBbox(corners) {
    const overlayCtx = window.overlayCanv.getContext("2d");
    overlayCtx.clearRect(
        0, 0,
        window.width,
        window.height
    );

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

function performTransform(h, elem) {
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
    elem.style.zIndex = 1;
}

function processVideo() {
    window.stats.begin();
    const frame = getFrame();
    const [h, warped] = window.homography.performAR(frame, window.width, window.height);
    performTransform(h, window.arElem);
    drawBbox(warped);
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
    window.homography = new Homography(() => {
        initStats();
        setupVideo(true, true, () => {
            window.homography.init(createRefIm(), refIm.width, refIm.height);
            window.arElem = document.getElementById("arElem");
            window.arElem.style["transform-origin"] = "top left"; // default is center
            requestAnimationFrame(processVideo);
        });
    });
}

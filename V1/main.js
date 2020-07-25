const videoElement = document.getElementById("videoElement");
const videoTargetCanvas = document.getElementById("videoTargetCanvas");

let stats = null;
let frame_uint_array = null;
let frame_uint8_ptr = null;
let arResult = null;

let width = 0;
let height = 0;

// var frames = 0;

const imRead = (im) => {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = im.width;
    canvas.height = im.height;

    ctx.drawImage(im, 0, 0);
    return ctx.getImageData(0, 0, im.width, im.height).data;
};

const imLoad = (cvs, uint8Arr) => {
    let ctx = cvs.getContext('2d');

    var imData = ctx.createImageData(cvs.width, cvs.height);
    imData.data.set(uint8Arr);

    ctx.putImageData(imData, 0, 0, 0, 0, cvs.width, cvs.height);
};

var Module = {
    onRuntimeInitialized:() => init(Module)
};

const init = async (Module) => {
    if (typeof Module === 'undefined') {
        console.log('* wasm module not loaded *');
        return;
    }
    console.log('* wasm module loaded *');

    await initStats();
    await startCamera();
};

const startCamera = async () => {
    await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment"
        },
        audio: false
    })
    .then(stream => {
        const videoSettings = stream.getVideoTracks()[0].getSettings();
        videoElement.srcObject = stream;
        videoElement.play();
    })
    .catch(function(err) {
        console.log("An error occured! " + err);
    });

    videoElement.addEventListener("canplay", function(ev){
        height = videoElement.videoHeight;
        width = videoElement.videoWidth;
        videoElement.setAttribute("width", width);
        videoElement.setAttribute("height", height);
        videoTargetCanvas.width = width;
        videoTargetCanvas.height = height;
        startVideoProcessing();
    }, false);
};

const startVideoProcessing = () => {
    initAR();
    requestAnimationFrame(processVideo);
}

const initStats = async () => {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
};

const initAR = () => {
    const refImg = document.getElementById("refImg");
    const ref_uint_array = imRead(refImg);
    const ref_uint8_ptr = window.Module._malloc(ref_uint_array.length);
    window.Module.HEAPU8.set(ref_uint_array, ref_uint8_ptr);

    const arImg = document.getElementById("arImg");
    const ar_uint_array = imRead(arImg);
    const ar_uint8_ptr = window.Module._malloc(ar_uint_array.length);
    window.Module.HEAPU8.set(ar_uint_array, ar_uint8_ptr);

    window.Module.initAR(ar_uint8_ptr, arImg.width, arImg.height,
                         ref_uint8_ptr, refImg.width, refImg.height);
};

const processVideo = () => {
    stats.begin();

    // if (frames % 2 == 0) {
        videoTargetCanvas.getContext("2d").drawImage(
            videoElement,
            0, 0,
            width, height
        );
        frame_uint_array = imRead(videoTargetCanvas);
        frame_uint8_ptr = window.Module._malloc(frame_uint_array.length);
        window.Module.HEAPU8.set(frame_uint_array, frame_uint8_ptr);

        arResult = window.Module.performAR(
            frame_uint8_ptr,
            videoTargetCanvas.width,
            videoTargetCanvas.height
        );

        imLoad(videoTargetCanvas, arResult);

        window.Module._free(frame_uint8_ptr);
    // }

    // frames++;

    stats.end();

    requestAnimationFrame(processVideo);
};

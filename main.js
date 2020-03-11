const videoElement = document.getElementById("videoElement");
const videoTargetCanvas = document.getElementById("videoTargetCanvas");

let stats = null;
const GOOD_MATCH_PERCENT = 0.1;
const GOOD_MATCH_THRESHOLD = 55;

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
        height = videoSettings.height;
        width = videoSettings.width;
        videoTargetCanvas.width = width;
        videoTargetCanvas.height = height;
        videoElement.srcObject = stream;
        videoElement.play();
    })
    .catch(function(err) {
        console.log("An error occured! " + err);
    });

    startVideoProcessing();
};

const startVideoProcessing = () => {
    requestAnimationFrame(processVideo);
}

const initStats = async () => {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
};

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

const processVideo = () => {
    stats.begin();

    videoTargetCanvas.getContext("2d").drawImage(videoElement, 0, 0);
    const frame_uint_array = imRead(videoTargetCanvas);
    const frame_uint8_ptr = window.Module._malloc(frame_uint_array.length);
    window.Module.HEAPU8.set(frame_uint_array, frame_uint8_ptr);

    const refImg = document.getElementById("refImg");
    const ref_uint_array = imRead(refImg);
    const ref_uint8_ptr = window.Module._malloc(ref_uint_array.length);
    window.Module.HEAPU8.set(ref_uint_array, ref_uint8_ptr);

    const arImg = document.getElementById("arImg");
    const ar_uint_array = imRead(arImg);
    const ar_uint8_ptr = window.Module._malloc(ar_uint_array.length);
    window.Module.HEAPU8.set(ar_uint_array, ar_uint8_ptr);

    var homoIm = window.Module.homo(frame_uint8_ptr, videoTargetCanvas.width, videoTargetCanvas.height,
                                    ref_uint8_ptr, refImg.width, refImg.height,
                                    ar_uint8_ptr, arImg.width, arImg.height,
                                    GOOD_MATCH_PERCENT, GOOD_MATCH_THRESHOLD);
    var homoImClamped = new Uint8ClampedArray(homoIm); // clamps homoIm to 0-255

    imLoad(videoTargetCanvas, homoImClamped);

    window.Module._free(frame_uint_array);
    window.Module._free(ref_uint_array);
    window.Module._free(ar_uint_array);

    stats.end();
    requestAnimationFrame(processVideo);
};

let stats = null;

let orb = null;
let matcher = null;
let refImg = null;
let arImg = null;
let des2 = null;
let kp2 = null;

let height = 0;
let width = 0;

const videoTargetCanvas = document.getElementById("videoTargetCanvas");
const videoElement = document.getElementById("videoElement");
// const tempCanvas = document.getElementById("tempCanvas");

window.onload = function() {
    var canvas = document.getElementById("canvasInput");
    var ctx = canvas.getContext("2d");
    var img = document.getElementById("ref_img");
    ctx.drawImage(img, 0, 0);
};

const startCamera = async() => {
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
};

const init = async() => {
    orb = new cv.ORB(500);
    arImg = cv.imread("ar_img");
    arImg.convertTo(arImg, cv.CV_32FC4, 1/255);

    refImg = cv.imread("ref_img");
    [des2, kp2] = orbDetect(refImg);

    matcher = new cv.BFMatcher(cv.NORM_HAMMING);
};

const orbDetect = (img) => {
    var des = new cv.Mat();
    var kps = new cv.KeyPointVector();
    let tmpMat = new cv.Mat();
    orb.detectAndCompute(img, tmpMat, kps, des);
    tmpMat.delete();
    return [des, kps];
};

const findBestMatches = (matches, ratio) => {
    let bestMatches = new cv.DMatchVector();
    for (let i = 0; i < matches.size(); i++) {
        let m = matches.get(i);
        if (m.distance < matches.size()*ratio) {
            bestMatches.push_back(m);
        }
    }
    return bestMatches;
};

const create4ChanMat = (mat) => {
    if (mat.channels() == 4) return mat;

    const width = mat.size().width, height = mat.size().height;
    let result = new cv.Mat();
    let vec = new cv.MatVector();

    for (var i=0; i<3; i++)
        vec.push_back(mat);
    vec.push_back(new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]))
    cv.merge(vec, result);

    vec.delete();

    return result;
};

const imgWrite = (src, dstCanvas) => {
    const tmp = new cv.Mat(src);
    if (tmp.type() === cv.CV_8UC1) {
        cv.cvtColor(tmp, tmp, cv.COLOR_GRAY2RGBA);
    }
    else if (tmp.type() === cv.CV_8UC3) {
        cv.cvtColor(tmp, tmp, cv.COLOR_RGB2RGBA);
    }
    const imgData = new ImageData(
        new Uint8ClampedArray(tmp.data),
        tmp.cols,
        tmp.rows
    );
    const ctx = dstCanvas.getContext("2d");
    dstCanvas.width = tmp.cols;
    dstCanvas.height = tmp.rows;
    ctx.putImageData(imgData, 0, 0);
    tmp.delete();
};

const imgRead = (canvas)=> {
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return cv.matFromImageData(imgData)
};

const rescale = (src, targetWidth) => {
    const dst = new cv.Mat();
    const srcSize = src.size();
    const dstSize = new cv.Size(
        targetWidth,
        (srcSize.height * targetWidth) / srcSize.width
    );
    cv.resize(src, dst, dstSize);
    return dst;
};

const processVideo = async (captureFromVideo = true) => {
    stats.begin();
    if (captureFromVideo) {
        videoTargetCanvas.getContext("2d").drawImage(videoElement, 0, 0);
    }

    const imgBuffer = imgRead(videoTargetCanvas);
    const src = rescale(imgBuffer, 500);

    let dst = new cv.Mat();
    let srcGray = new cv.Mat();
    cv.cvtColor(src, srcGray, cv.COLOR_RGBA2GRAY);

    dst = src;

    let [des1, kp1] = orbDetect(srcGray);

    let matches = new cv.DMatchVector();
    let tmpMat = new cv.Mat();
    matcher.match(des1, des2, matches, tmpMat);

    let good = findBestMatches(matches, 0.1);

    if (good.size() >= 20) {
        const rows = good.size(), cols = 2;
        let coords1 = []
        let coords2 = []
        for (var i = 0; i < rows; i++) {
            let m = good.get(i);
            coords1.push(kp1.get(m.queryIdx).pt.x);
            coords1.push(kp1.get(m.queryIdx).pt.y);
            coords2.push(kp2.get(m.trainIdx).pt.x);
            coords2.push(kp2.get(m.trainIdx).pt.y);
        }

        let coords1Mat = cv.matFromArray(coords1.length/2, cols, cv.CV_32F, coords1);
        let coords2Mat = cv.matFromArray(coords2.length/2, cols, cv.CV_32F, coords2);

        let H = cv.findHomography(coords2Mat, coords1Mat, cv.RANSAC);

        let mask = new cv.Mat(refImg.rows, refImg.cols, cv.CV_32FC1, [1,1,1,1]);
        let maskWarp = new cv.Mat(height, width, cv.CV_32FC1);
        cv.warpPerspective(
            mask,
            maskWarp,
            H,
            new cv.Size(width, height)
        );

        let arWarp = new cv.Mat(height, width, cv.CV_32FC1);
        cv.warpPerspective(
            arImg,
            arWarp,
            H,
            new cv.Size(width, height)
        );

        let maskWarpInv = new cv.Mat();
        let maskTmp = new cv.Mat();
        const ones = new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]);
        cv.subtract(ones, maskWarp, maskWarpInv, maskTmp, cv.CV_32FC1);
        console.log("here")

        // let maskWarpMat = create4ChanMat(maskWarp);
        // let maskWarpInvMat = create4ChanMat(maskWarpInv);

        // let maskedSrc = new cv.Mat();
        // let srcCopy = new cv.Mat();
        // src.convertTo(srcCopy, cv.CV_32FC4, 1/255);
        // cv.multiply(srcCopy, maskWarpInvMat, maskedSrc, 1, cv.CV_32FC4);

        // let maskedBook = new cv.Mat();
        // cv.multiply(arWarp, maskWarpMat, maskedBook, 1, cv.CV_32FC4);

        // let outTmp = new cv.Mat();
        // cv.add(maskedSrc, maskedBook, dst, outTmp, cv.CV_32FC1);

        // H.delete();
        // coords1Mat.delete();
        // coords2Mat.delete();
        // mask.delete();
        // maskWarp.delete();
        // arWarp.delete();
        // maskWarpInv.delete();
        // maskWarpMat.delete();
        // maskWarpInvMat.delete();
        // maskTmp.delete();
        // maskedSrc.delete();
        // maskedBook.delete();
        // outTmp.delete();
        // srcCopy.delete();
    }

    imgWrite(dst, videoTargetCanvas);

    des1.delete();
    kp1.delete();
    matches.delete();
    tmpMat.delete();
    good.delete();
    src.delete();
    imgBuffer.delete();
    srcGray.delete();

    frames += 1;
    stats.end();
    return;
};

const initStats = async() => {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById("stats").appendChild(stats.domElement);
};

cv["onRuntimeInitialized"] = async () => {
    await init();
    await initStats();
    await startCamera();
    setInterval(processVideo, 100);
};

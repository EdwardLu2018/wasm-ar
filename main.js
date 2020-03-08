const streaming = false;
const width = window.innerWidth / 2;
const height = 0;

const video = document.getElementById("video");
const stream = null;
const vc = null;
const src = null;
const dst = null;

const stats = null;

const orb = null;
const matcher = null;
const ref_img = null;
const des2 = null;
const kp2 = null;

window.onload = function() {
    var canvas = document.getElementById("canvasInput");
    canvas.width = width;
    var ctx = canvas.getContext("2d");
    var img = document.getElementById("ref");
    ctx.drawImage(img, 0, 0);
};

function startCamera() {
    if (streaming) return;
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(s) {
        stream = s;
        video.srcObject = s;
        video.play();
    })
    .catch(function(err) {
        console.log("An error occured! " + err);
    });

    video.addEventListener("canplay", function(ev){
        if (!streaming) {
            height = video.videoHeight / (video.videoWidth/width);
            video.setAttribute("width", width);
            video.setAttribute("height", height);
            streaming = true;
            vc = new cv.VideoCapture(video);

            orb = new cv.ORB(250);
            ref_img = cv.imread("ref");

            const mat2 = new cv.Mat();
            des2 = new cv.Mat();
            kp2 = new cv.KeyPointVector();
            orb.detectAndCompute(ref_img, mat2, kp2, des2);
            mat2.deconste();

            matcher = new cv.BFMatcher(cv.NORM_HAMMING, true);
        }
        startVideoProcessing();
    }, false);
}

function startVideoProcessing() {
    if (!streaming) {
        alert("Please startup your webcam!");
        return;
    }
    stopVideoProcessing();
    src = new cv.Mat(height, width, cv.CV_8UC4);
    requestAnimationFrame(processVideo);
}

function processVideo() {
    stats.begin();
    vc.read(src);
    try {
        // const src_gray = new cv.Mat();
        // cv.cvtColor(src, src_gray, cv.COLOR_RGBA2GRAY);

        const mat1 = new cv.Mat();
        const des1 = new cv.Mat();
        const kp1 = new cv.KeyPointVector();

        orb.detectAndCompute(src, mat1, kp1, des1);

        const matches = new cv.DMatchVectorVector();
        const mask = new cv.Mat();
        matcher.knnMatch(des1, des2, matches, 2, mask, false);

        const ratio = .5, good = new cv.DMatchVectorVector();
        for (const i = 0; i < matches.size(); i++) {
            const m = matches.get(i).get(0), n = matches.get(i).get(1);
            if (m.distance < ratio * n.distance) {
                const t = new cv.DMatchVector();
                t.push_back(m);
                good.push_back(t);
            }
        }

        const dst = new cv.Mat(height, width, cv.CV_8UC1);
        // cv.drawMatches(src, kp1, ref_img, kp2, good, dst);
        const mc = new cv.Scalar(-1, -1, -1, -1), sc = new cv.Scalar(0, 255, 0, 0), maskingCharVecVec = new cv.CharVectorVector();
        cv.drawMatchesKnn(src, kp1, ref_img, kp2, good, dst, mc, sc, maskingCharVecVec, 2);
        // cv.drawKeypoints(ref_img, kp2, dst);

        cv.imshow("canvasOutput", dst);
        stats.end();
    }
    catch(err) {
        console.log(err.message);
    }
    requestAnimationFrame(processVideo);
}

function stopVideoProcessing() {
    if (src != null && !src.isDeconsted()) src.deconste();
}

function main() {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById('container').appendChild(stats.domElement);
    startCamera();
}

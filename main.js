let streaming = false;
let width = window.innerWidth / 2;
let height = 0;

let video = document.getElementById("video");
let stream = null;
let vc = null;
let src = null;
let dst = null;

let stats = null;

let orb = null;
let matcher = null;
let ref_img = null;
let des2 = null;
let kp2 = null;

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

            let mat2 = new cv.Mat();
            des2 = new cv.Mat();
            kp2 = new cv.KeyPointVector();
            orb.detectAndCompute(ref_img, mat2, kp2, des2);
            mat2.delete();

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
        // let src_gray = new cv.Mat();
        // cv.cvtColor(src, src_gray, cv.COLOR_RGBA2GRAY);

        // let mat1 = new cv.Mat();
        // let des1 = new cv.Mat();
        // let kp1 = new cv.KeyPointVector();

        // orb.detectAndCompute(src_gray, mat1, kp1, des1);

        // let matches = new cv.DMatchVector();
        // let mat = new cv.Mat();
        // matcher.match(des1, des2, matches, mat);

        // let good = new cv.DMatchVector();
        // for (let i = 0; i < matches.size(); i++) {
        //     let match = matches.get(i);
        //     if (match.distance < matches.size()*0.5) {
        //         good.push_back(match);
        //     }
        // }

        let dst = new cv.Mat(height, width, cv.CV_8UC1);
        // cv.drawMatches(src_gray, kp1, ref_img, kp2, good, dst);
        cv.drawKeypoints(ref_img, kp2, dst);

        cv.imshow("canvasOutput", dst);
        stats.end();

    }
    catch(err) {
        console.log(err.message);
    }
    requestAnimationFrame(processVideo);
}

function stopVideoProcessing() {
    if (src != null && !src.isDeleted()) src.delete();
}

function main() {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById('container').appendChild(stats.domElement);
    startCamera();
}

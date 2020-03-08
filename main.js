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
let hp_img = null;
let des2 = null;
let kp2 = null;

var frames = 0;

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

            orb = new cv.ORB(500);
            ref_img = cv.imread("ref");
            hp_img = cv.imread("hp");

            let mat2 = new cv.Mat();
            des2 = new cv.Mat();
            kp2 = new cv.KeyPointVector();
            orb.detectAndCompute(ref_img, mat2, kp2, des2);
            mat2.delete();

            matcher = new cv.BFMatcher(cv.NORM_HAMMING);
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
    src = new cv.Mat(height, width, cv.CV_32FC4); //cv.CV_8UC4);
    dst = new cv.Mat(height, width, cv.CV_32FC1); //cv.CV_8UC1);
    requestAnimationFrame(processVideo);
}

function processVideo() {
    stats.begin();
    vc.read(src);
    try {
        if (frames % 5 == 0) {
            let src_gray = new cv.Mat();
            cv.cvtColor(src, src_gray, cv.COLOR_RGBA2GRAY);

            let mat1 = new cv.Mat();
            let des1 = new cv.Mat();
            let kp1 = new cv.KeyPointVector();

            orb.detectAndCompute(src_gray, mat1, kp1, des1);

            let matches = new cv.DMatchVector();
            let mask = new cv.Mat();
            matcher.match(des1, des2, matches, mask);

            let good = new cv.DMatchVector();
            for (let i = 0; i < matches.size(); i++) {
                let m = matches.get(i);
                if (m.distance < matches.size()*0.075) {
                    good.push_back(m);
                }
            }

            // cv.drawMatches(src_gray, kp1, ref_img, kp2, good, dst);
            // cv.drawKeypoints(ref_img, kp2, dst);

            if (good.size() >= 4) {
                const rows = good.size()/4, cols = 2;
                let coords1 = []
                let coords2 = []
                for (let i = 0; i < rows; i++) {
                    let m = good.get(i);
                    coords1.push(kp1.get(m.queryIdx).pt.x);
                    coords1.push(kp1.get(m.queryIdx).pt.y);
                    coords2.push(kp2.get(m.trainIdx).pt.x);
                    coords2.push(kp2.get(m.trainIdx).pt.y);
                }

                let coords1_mat = cv.matFromArray(coords1.length/2, cols, cv.CV_32F, coords1);
                let coords2_mat = cv.matFromArray(coords2.length/2, cols, cv.CV_32F, coords2);

                let H = cv.findHomography(coords2_mat, coords1_mat, cv.RANSAC);

                coords1_mat.delete();
                coords2_mat.delete();

                let mask = new cv.Mat(ref_img.rows, ref_img.cols, cv.CV_32FC1, [1,1,1,1]);
                let mask_warp = new cv.Mat(height, width, cv.CV_32FC1);
                cv.warpPerspective(
                    mask,
                    mask_warp,
                    H,
                    new cv.Size(height, width)
                );

                let hp_warp = new cv.Mat(height, width, cv.CV_32FC1);
                cv.warpPerspective(
                    hp_img,
                    hp_warp,
                    H,
                    new cv.Size(height, width)
                );

                // let template = new cv.Mat(height, width, cv.CV_32FC1);
                cv.multiply(hp_warp, mask_warp, dst);
            }

            cv.imshow("canvasOutput", dst);
            mat1.delete();
            mask.delete();
            des1.delete();
            kp1.delete();
        }
    }
    catch(err) {
        console.log(err.message);
    }
    stats.end();
    frames += 1;
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

let streaming = false;
let width = window.innerWidth * 3 / 4;
let height = 0;

let video = document.getElementById("video");
let stream = null;
let vc = null;
let src = null;
let dst = null;

let stats = null;

let orb = null;
let matcher = null;
let refImg = null;
let hp_img = Ill;
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

    video.addEventListener("canplay", function(ev) {
        if (!streaming) {
            height = video.videoHeight / (video.videoWidth/width);
            video.setAttribute("width", width);
            video.setAttribute("height", height);
            streaming = true;
            vc = new cv.VideoCapture(video);

            orb = new cv.ORB(500);
            refImg = cv.imread("ref");
            hp_img = cv.imread("I");
            hp_img.convertTo(hp_img, cv.CV_32FC4, 1/I5);

            des2 = new cv.Mat();
            kp2 = new cv.KeyPointVector();
            orb.detectAndCompute(refImg, new cv.Mat(), kp2, des2);
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
    src = new cv.Mat(height, width, cv.CV_8UC4);
    dst = new cv.Mat(height, width, cv.CV_8UC1);
    requestAnimationFrame(processVideo);
}

function processVideo() {
    stats.begin();
    vc.read(src);
    try {
        if (frames % 3 == 0) {
            let srcGray = new cv.Mat();
            cv.cvtColor(src, srcGray, cv.COLOR_RGBA2GRAY);

            let srcCopy = src.clone();
            dst = srcCopy;
            srcCopy.convertTo(srcCopy, cv.CV_32FC4, 1/255);

            let des1 = new cv.Mat();
            let kp1 = new cv.KeyPointVector();
            orb.detectAndCompute(srcGray, new cv.Mat(), kp1, des1);

            let matches = new cv.DMatchVector();
            matcher.match(des1, des2, matches, new cv.Mat());

            let good = new cv.DMatchVector();
            for (let i = 0; i < matches.size(); i++) {
                let m = matches.get(i);
                if (m.distance < matches.size()*0.1) {
                    good.push_back(m);
                }
            }

            // cv.drawMatches(srcGray, kp1, refImg, kp2, good, dst);
            // cv.drawKeypoints(refImg, kp2, dst);

            if (good.size() >= 10) {
                const rows = good.size(), cols = 2;
                let coords1 = []
                let coords2 = []
                for (let i = 0; i < rows; i++) {
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

                let maskWarpInv = new cv.Mat();

                let ones = new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]);
                cv.subtract(ones, maskWarp, maskWarpInv, new cv.Mat(), cv.CV_32FC1);

                let hpWarp = new cv.Mat(height, width, cv.CV_32FC1);
                cv.warpPerspective(
                    hpImg,
                    hpWarp,
                    H,
                    new cv.Size(width, height)
                );

                let maskWarpMat = new cv.Mat();
                let maskWarpVec = new cv.MatVector();
                for (var i=0;i<3;i++) maskWarpVec.push_back(maskWarp);
                maskWarpVec.push_back(new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]))
                cv.merge(maskWarpVec, maskWarpMat);

                let maskWarpInvMat = new cv.Mat();
                let maskWarpInvVec = new cv.MatVector();
                for (var i=0;i<3;i++) maskWarpInvVec.push_back(maskWarpInv);
                maskWarpInvVec.push_back(new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]))
                cv.merge(maskWarpInvVec, maskWarpInvMat);

                let maskedSrc = new cv.Mat();
                cv.multiply(srcCopy, maskWarpInvMat, maskedSrc, 1, cv.CV_32FC4);

                let maskedBook = new cv.Mat();
                cv.multiply(hpWarp, maskWarpMat, maskedBook, 1, cv.CV_32FC4);

                cv.add(maskedSrc, maskedBook, dst, new cv.Mat(), cv.CV_32FC1);

                H.delete();
                mask.delete();
                coords1Mat.delete();
                coords2Mat.delete();
                maskWarp.delete();
                maskWarpMat.delete();
                maskWarpVec.delete();
                ones.delete();
                maskWarpInv.delete();
                maskWarpInvMat.delete();
                maskWarpInvVec.delete();
                maskedSrc.delete();
                maskedBook.delete();
            }
            srcGray.delete();
            des1.delete();
            kp1.delete();
            matches.delete();
            good.delete();
        }

        cv.imshow("canvasOutput", dst);
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
    initStats();
    startCamera();
}

function initStats() {
    stats = new Stats();
    stats.showPanel(0);
    document.getElementById('stats').appendChild(stats.domElement);
}

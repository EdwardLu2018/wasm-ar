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
let arImg = null;
let des2 = null;
let kp2 = null;
let ones = null;

var frames = 0;

window.onload = function() {
    var canvas = document.getElementById("canvasInput");
    canvas.width = width;
    var ctx = canvas.getContext("2d");
    var img = document.getElementById("ref_img");
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
            arImg = cv.imread("ar_img");
            arImg.convertTo(arImg, cv.CV_32FC4, 1/255);

            refImg = cv.imread("ref_img");
            [des2, kp2] = orbDetect(refImg);

            matcher = new cv.BFMatcher(cv.NORM_HAMMING);

            ones = new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]);
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

function orbDetect(img) {
    var des = new cv.Mat();
    var kps = new cv.KeyPointVector();
    let tmpMat = new cv.Mat();
    orb.detectAndCompute(img, tmpMat, kps, des);
    tmpMat.delete();
    return [des, kps];
}

function findBestMatches(matches, ratio) {
    let bestMatches = new cv.DMatchVector();
    for (let i = 0; i < matches.size(); i++) {
        let m = matches.get(i);
        if (m.distance < matches.size()*ratio) {
            bestMatches.push_back(m);
        }
    }
    return bestMatches;
}

function create4ChanMat(mat) {
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

            let [des1, kp1] = orbDetect(srcGray);

            let matches = new cv.DMatchVector();
            let tmpMat = new cv.Mat();
            matcher.match(des1, des2, matches, tmpMat);

            let good = findBestMatches(matches, 0.1);
            // cv.drawMatches(srcGray, kp1, refImg, kp2, good, dst);
            // cv.drawKeypoints(refImg, kp2, dst);
            if (good.size() >= 10) {
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
                cv.subtract(ones, maskWarp, maskWarpInv, new cv.Mat(), cv.CV_32FC1);

                let maskWarpMat = create4ChanMat(maskWarp);
                let maskWarpInvMat = create4ChanMat(maskWarpInv);

                let maskedSrc = new cv.Mat();
                srcCopy.convertTo(srcCopy, cv.CV_32FC4, 1/255);
                cv.multiply(srcCopy, maskWarpInvMat, maskedSrc, 1, cv.CV_32FC4);

                let maskedBook = new cv.Mat();
                cv.multiply(arWarp, maskWarpMat, maskedBook, 1, cv.CV_32FC4);

                cv.add(maskedSrc, maskedBook, dst, new cv.Mat(), cv.CV_32FC1);

                H.delete();
                mask.delete();
                coords1Mat.delete();
                coords2Mat.delete();
                maskedSrc.delete();
                maskedBook.delete();
            }
            srcGray.delete();
            des1.delete();
            kp1.delete();
            matches.delete();
            tmpMat.delete();
            good.delete();
        }

        cv.imshow("canvasOutput", dst);
    }
    catch (err) {
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

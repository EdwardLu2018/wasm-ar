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

    video.addEventListener("canplay", function(ev) {
        if (!streaming) {
            height = video.videoHeight / (video.videoWidth/width);
            video.setAttribute("width", width);
            video.setAttribute("height", height);
            streaming = true;
            vc = new cv.VideoCapture(video);

            orb = new cv.ORB(500);
            ref_img = cv.imread("ref");
            hp_img = cv.imread("hp");
            hp_img.convertTo(hp_img, cv.CV_32FC4, 1/255);

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
    src = new cv.Mat(height, width, cv.CV_8UC4);
    dst = new cv.Mat(height, width, cv.CV_8UC1);
    requestAnimationFrame(processVideo);
}

function processVideo() {
    stats.begin();
    vc.read(src);
    try {
        if (frames % 5 == 0) {
            let src_gray = new cv.Mat();
            cv.cvtColor(src, src_gray, cv.COLOR_RGBA2GRAY);

            let des1 = new cv.Mat();
            let kp1 = new cv.KeyPointVector();
            orb.detectAndCompute(src_gray, new cv.Mat(), kp1, des1);

            let matches = new cv.DMatchVector();
            matcher.match(des1, des2, matches, new cv.Mat());

            let good = new cv.DMatchVector();
            for (let i = 0; i < matches.size(); i++) {
                let m = matches.get(i);
                if (m.distance < matches.size()*0.075) {
                    good.push_back(m);
                }
            }

            // cv.drawMatches(src_gray, kp1, ref_img, kp2, good, dst);
            // cv.drawKeypoints(ref_img, kp2, dst);

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

                let coords1_mat = cv.matFromArray(coords1.length/2, cols, cv.CV_32F, coords1);
                let coords2_mat = cv.matFromArray(coords2.length/2, cols, cv.CV_32F, coords2);

                let H = cv.findHomography(coords2_mat, coords1_mat, cv.RANSAC);

                let mask = new cv.Mat(ref_img.rows, ref_img.cols, cv.CV_32FC1, [1,1,1,1]);
                let mask_warp = new cv.Mat(height, width, cv.CV_32FC1);
                cv.warpPerspective(
                    mask,
                    mask_warp,
                    H,
                    new cv.Size(width, height)
                );

                let mask_warp_inv = new cv.Mat();

                let ones = new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]);
                cv.subtract(ones, mask_warp, mask_warp_inv, new cv.Mat(), cv.CV_32FC1);

                let hp_warp = new cv.Mat(height, width, cv.CV_32FC1);
                cv.warpPerspective(
                    hp_img,
                    hp_warp,
                    H,
                    new cv.Size(width, height)
                );

                let mask_warp_img = new cv.Mat();
                let mask_warp_vec = new cv.MatVector();
                for (var i=0;i<3;i++) mask_warp_vec.push_back(mask_warp);
                mask_warp_vec.push_back(new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]))
                cv.merge(mask_warp_vec, mask_warp_img);

                let mask_warp_inv_img = new cv.Mat();
                let mask_warp_inv_vec = new cv.MatVector();
                for (var i=0;i<3;i++) mask_warp_inv_vec.push_back(mask_warp_inv);
                mask_warp_inv_vec.push_back(new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]))
                cv.merge(mask_warp_inv_vec, mask_warp_inv_img);

                let src_copy = src.clone()
                src_copy.convertTo(src_copy, cv.CV_32FC4, 1/255);

                let masked_src = new cv.Mat();
                cv.multiply(src_copy, mask_warp_inv_img, masked_src, 1, cv.CV_32FC4);

                let masked_book = new cv.Mat();
                cv.multiply(hp_warp, mask_warp_img, masked_book, 1, cv.CV_32FC4);

                cv.add(masked_src, masked_book, dst, new cv.Mat(), cv.CV_32FC1);

                H.delete();
                mask.delete();
                coords1_mat.delete();
                coords2_mat.delete();
                mask_warp.delete();
                mask_warp_img.delete();
                mask_warp_vec.delete();
                ones.delete();
                mask_warp_inv.delete();
                mask_warp_inv_img.delete();
                mask_warp_inv_vec.delete();
                src_copy.delete();
                masked_src.delete();
                masked_book.delete();
            }

            cv.imshow("canvasOutput", dst);
            new cv.Mat().delete();
            des1.delete();
            kp1.delete();
            matches.delete();
            good.delete();
        }
        else {
            dst = src.clone();
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

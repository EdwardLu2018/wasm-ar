#include <emscripten/bind.h>
#include <emscripten/val.h>

#include <opencv2/core.hpp>
#include <opencv2/core/utility.hpp>
#include <opencv2/core/ocl.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/calib3d/calib3d.hpp>
#include <opencv2/features2d.hpp>
#include <opencv2/xfeatures2d.hpp>
#include <opencv2/xfeatures2d/nonfree.hpp>

using namespace std;
using namespace emscripten;
using namespace cv;
using namespace cv::xfeatures2d;

const float GOOD_MATCH_PERCENT = 0.7f;
const int MAX_FEATURE_POINTS = 1000;

Ptr<ORB> orb = NULL;
Ptr<BFMatcher> desc_matcher = NULL;

Mat ar, refGray, dst, mask, descr2;

vector<KeyPoint> kps1, kps2;

void initAR(const int & arAddr, const size_t arCols, const size_t arRows,
            const int & refAddr, const size_t refCols, const size_t refRows) {
    orb = ORB::create(MAX_FEATURE_POINTS);
    desc_matcher = BFMatcher::create();

    uint8_t *arData = reinterpret_cast<uint8_t *>(arAddr);
    uint8_t *refData = reinterpret_cast<uint8_t *>(refAddr);

    ar = Mat(arRows, arCols, CV_8UC4, arData);
    Mat refIm(refRows, refCols, CV_8UC4, refData);

    mask = Mat::ones(ar.rows, ar.cols, CV_32FC1);

    cvtColor(refIm, refGray, cv::COLOR_BGR2GRAY);

    orb->detectAndCompute(refGray, noArray(), kps2, descr2);
}

emscripten::val performAR(const int & srcAddr, const size_t srcCols, const size_t srcRows) {
    uint8_t *srcData = reinterpret_cast<uint8_t *>(srcAddr);

    Mat src (srcRows, srcCols, CV_8UC4, srcData);
    dst = src;

    Mat srcGray;
    cvtColor(src, srcGray, cv::COLOR_BGR2GRAY);

    if (orb != NULL && desc_matcher != NULL) {
        Mat descr1;
        orb->detectAndCompute(srcGray, noArray(), kps1, descr1);
        srcGray.release();

        vector<vector<DMatch>> knn_matches;
        desc_matcher->knnMatch(descr1, descr2, knn_matches, 2);
        descr1.release();

        vector<Point2f> dst_pts, src_pts;
        for (size_t i = 0; i < knn_matches.size(); ++i) {
            if (knn_matches[i][0].distance < GOOD_MATCH_PERCENT * knn_matches[i][1].distance) {
                dst_pts.push_back( kps1[knn_matches[i][0].queryIdx].pt );
                src_pts.push_back( kps2[knn_matches[i][0].trainIdx].pt );
            }
        }

        // need 4 pts to define homography, rounded up to 10
        if (dst_pts.size() > 10) {
            Mat h = findHomography(src_pts, dst_pts, FM_RANSAC);

            Mat arWarp;
            warpPerspective(ar, arWarp, h, src.size());

            Mat maskWarp;
            warpPerspective(mask, maskWarp, h, src.size());

            h.release();

            Mat ones = Mat::ones(src.rows, src.cols, CV_32FC1);
            Mat maskWarpInv;
            subtract(ones, maskWarp, maskWarpInv, noArray(), CV_32FC1);

            Mat maskWarpMat;
            Mat maskWarpVec[] = {maskWarp, maskWarp, maskWarp, ones};
            merge(maskWarpVec, 4, maskWarpMat);
            maskWarp.release();

            Mat maskWarpInvMat;
            Mat maskWarpInvVec[] = {maskWarpInv, maskWarpInv, maskWarpInv, ones};
            merge(maskWarpInvVec, 4, maskWarpInvMat);
            maskWarpInv.release();

            ones.release();

            Mat maskedSrc, maskedBook;
            multiply(src, maskWarpInvMat, maskedSrc, 1, CV_8UC4);
            multiply(arWarp, maskWarpMat, maskedBook, 1, CV_8UC4);

            arWarp.release();
            maskWarpMat.release();
            maskWarpInvMat.release();

            add(maskedSrc, maskedBook, dst, noArray(), CV_8UC1);

            maskedSrc.release();
            maskedBook.release();
        }
    }

    val result = val(emscripten::memory_view<uint8_t>((dst.total()*dst.elemSize())/sizeof(uint8_t), (uint8_t *)dst.data));
    return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("initAR", &initAR, allow_raw_pointers());
    emscripten::function("performAR", &performAR, allow_raw_pointers());
}

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

bool initialized = false;

Mat ar, refGray, dst, mask, descr2;

vector<KeyPoint> kps1, kps2;

void initAR(const int &arAddr, const size_t arCols, const size_t arRows,
            const int &refAddr, const size_t refCols, const size_t refRows) {
    orb = ORB::create(MAX_FEATURE_POINTS);
    desc_matcher = BFMatcher::create();

    uint8_t *arData = reinterpret_cast<uint8_t *>(arAddr);
    uint8_t *refData = reinterpret_cast<uint8_t *>(refAddr);

    ar = Mat(arRows, arCols, CV_8UC4, arData);
    Mat refIm(refRows, refCols, CV_8UC4, refData);

    mask = Mat::ones(ar.rows, ar.cols, CV_8UC1);

    cvtColor(refIm, refGray, cv::COLOR_BGR2GRAY);

    orb->detectAndCompute(refGray, noArray(), kps2, descr2);

    initialized = true;
}

static void homographyAndCompose(InputArray src, OutputArray dst,
                                 vector<Point2f> src_pts, vector<Point2f> dst_pts) {
    Mat H = findHomography(src_pts, dst_pts, RANSAC);

    Mat arWarp;
    warpPerspective(ar, arWarp, H, src.size());

    Mat maskWarp;
    warpPerspective(mask, maskWarp, H, src.size());

    H.release();

    Mat maskWarpInv = 1 - maskWarp;

    Mat maskedSrc = Mat::zeros(src.size(), src.type());
    Mat maskedAr = Mat::zeros(arWarp.size(), arWarp.type());

    src.copyTo(maskedSrc, maskWarpInv);
    arWarp.copyTo(maskedAr, maskWarp);

    arWarp.release();
    maskWarp.release();
    maskWarpInv.release();

    add(maskedSrc, maskedAr, dst, noArray(), CV_8UC1);

    maskedSrc.release();
    maskedAr.release();
}

emscripten::val performAR(const int &srcAddr, const size_t srcCols, const size_t srcRows) {
    uint8_t *srcData = reinterpret_cast<uint8_t *>(srcAddr);

    Mat src (srcRows, srcCols, CV_8UC4, srcData);
    dst = src;

    Mat srcGray;
    cvtColor(src, srcGray, cv::COLOR_BGR2GRAY);

    if (initialized) {
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
            homographyAndCompose(src, dst, src_pts, dst_pts);
        }
    }

    val result = val(memory_view<uint8_t>((dst.total()*dst.elemSize())/sizeof(uint8_t), (uint8_t *)dst.data));
    return result;
}

EMSCRIPTEN_BINDINGS(module) {
    emscripten::function("initAR", &initAR, allow_raw_pointers());
    emscripten::function("performAR", &performAR, allow_raw_pointers());
}

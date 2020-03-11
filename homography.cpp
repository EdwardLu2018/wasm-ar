#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <opencv2/core.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include "opencv2/calib3d/calib3d.hpp"
#include "opencv2/xfeatures2d.hpp"
#include "opencv2/features2d.hpp"

using namespace std;
using namespace emscripten;
using namespace cv;
using namespace cv::xfeatures2d;

const int MAX_FEATURES = 500;
const float GOOD_MATCH_PERCENT = 0.1f;

emscripten::val homo(const int & srcAddr, const size_t srcCols, const size_t srcRows,
                     const int & refAddr, const size_t refCols, const size_t refRows,
                     const int & arAddr, const size_t arCols, const size_t arRows,
                     const size_t GOOD_MATCH_THRESHOLD)
{
    uint8_t *srcData = reinterpret_cast<uint8_t *>(srcAddr);
    uint8_t *refData = reinterpret_cast<uint8_t *>(refAddr);
    uint8_t *arData = reinterpret_cast<uint8_t *>(arAddr);

    Mat src (srcRows, srcCols, CV_8UC4, srcData);
    Mat ref (refRows, refCols, CV_8UC4, refData);
    Mat ar (arRows, arCols, CV_8UC4, arData);

    Mat dst = src;

    Mat srcGray, refGray;
    cv::cvtColor(src, srcGray, cv::COLOR_BGR2GRAY);
    cv::cvtColor(ref, refGray, cv::COLOR_BGR2GRAY);

    std::vector<KeyPoint> kps1, kps2;

    Mat descr1, descr2;
    Ptr<Feature2D> orb = ORB::create(MAX_FEATURES);
    orb->detectAndCompute(srcGray, Mat(), kps1, descr1);
    orb->detectAndCompute(refGray, Mat(), kps2, descr2);
    srcGray.release();
    refGray.release();

    std::vector<DMatch> matches;
    Ptr<DescriptorMatcher> matcher = DescriptorMatcher::create("BruteForce-Hamming");
    matcher->match(descr1, descr2, matches, Mat());
    matcher.release();
    descr1.release();
    descr2.release();

    std::sort(matches.begin(), matches.end());
    const int numGoodMatches = matches.size() * GOOD_MATCH_PERCENT;
    matches.erase(matches.begin()+numGoodMatches, matches.end());

    // Mat imMatches;
    // drawMatches(src, kps1, ref, kps2, matches, imMatches);

    if (matches.size() >= GOOD_MATCH_THRESHOLD) {
        std::vector<Point2f> points1, points2;
        for( size_t i = 0; i < matches.size(); i++ ) {
            points1.push_back( kps1[matches[i].queryIdx].pt );
            points2.push_back( kps2[matches[i].trainIdx].pt );
        }

        Mat h = findHomography(points2, points1, RANSAC);

        Mat arWarp;
        warpPerspective(ar, arWarp, h, src.size());

        Mat mask = Mat::ones(ar.rows, ar.cols, CV_32FC1);
        Mat maskWarp;
        warpPerspective(mask, maskWarp, h, src.size());

        h.release();
        mask.release();

        Mat ones = Mat::ones(src.rows, src.cols, CV_32FC1);
        Mat maskWarpInv;
        subtract(ones, maskWarp, maskWarpInv, Mat(), CV_32FC1);
        ones.release();

        Mat maskWarpMat;
        Mat maskWarpVec[] = {maskWarp, maskWarp, maskWarp,  Mat::ones(src.rows, src.cols, CV_32FC1)};
        merge(maskWarpVec, 4, maskWarpMat);
        maskWarp.release();

        Mat maskWarpInvMat;
        Mat maskWarpInvVec[] = {maskWarpInv, maskWarpInv, maskWarpInv,  Mat::ones(src.rows, src.cols, CV_32FC1)};
        merge(maskWarpInvVec, 4, maskWarpInvMat);
        maskWarpInv.release();

        src.convertTo(src, CV_32FC4, 1.0f/255.0f);
        arWarp.convertTo(arWarp, CV_32FC4, 1.0f/255.0f);

        Mat maskedSrc;
        multiply(src, maskWarpInvMat, maskedSrc, 1, CV_32FC4);

        Mat maskedBook;
        multiply(arWarp, maskWarpMat, maskedBook, 1, CV_32FC4);

        arWarp.release();
        maskWarpMat.release();
        maskWarpInvMat.release();

        add(maskedSrc, maskedBook, dst, Mat(), CV_32FC1);
        dst.convertTo(dst, CV_8UC4, 255);

        maskedSrc.release();
        maskedBook.release();
    }

    val result = val(emscripten::memory_view<uint8_t>((dst.total()*dst.elemSize())/sizeof(uint8_t), (uint8_t *)dst.data));
    return result;
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("homo", &homo, allow_raw_pointers());
}

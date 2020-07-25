#include <iostream>

#include <emscripten/emscripten.h>

// #include <opencv2/core.hpp>
#include <opencv2/core/types_c.h>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/calib3d/calib3d.hpp>
#include <opencv2/features2d.hpp>

using namespace std;
using namespace cv;

#define GOOD_MATCH_PERCENT  0.7f
#define MAX_FEATURES        1500

bool initialized = false;

Ptr<ORB> orb = NULL;
Ptr<BFMatcher> desc_matcher = NULL;

Mat refGray, descr1, descr2;

vector<KeyPoint> kps1, kps2;
vector<Point2f> corners(4);

EMSCRIPTEN_KEEPALIVE
void initAR(uchar refData[], size_t refCols, size_t refRows) {
    orb = ORB::create(MAX_FEATURES);
    desc_matcher = BFMatcher::create();

    uchar gray[refRows][refCols];
    uint32_t idx;
    for (int i = 0; i < refRows; ++i) {
        for (int j = 0; j < refCols; ++j) {
            idx = (i * refCols * 4) + j * 4;

            // rgba to rgb
            uchar r = refData[idx];
            uchar g = refData[idx + 1];
            uchar b = refData[idx + 2];
            // uchar a = refData[idx + 3];

            // turn src image to gray scale
            gray[i][j] = (0.30 * r) + (0.59 * g) + (0.11 * b);
        }
    }

    Mat refGray(refRows, refCols, CV_8UC1, gray);

    orb->detectAndCompute(refGray, noArray(), kps2, descr2);

    corners[0] = cvPoint( 0, 0 );
    corners[1] = cvPoint( refCols, 0 );
    corners[2] = cvPoint( refCols, refRows );
    corners[3] = cvPoint( 0, refRows );

    initialized = true;
}

EMSCRIPTEN_KEEPALIVE
double *performAR(uchar srcData[], size_t srcCols, size_t srcRows) {
    static Mat H;
    static vector<Point2f> warped(4);

    double *result = new double[17]; // 9 from h, 8 from warp

    uchar gray[srcRows][srcCols];
    uint32_t idx;
    for (int i = 0; i < srcRows; ++i) {
        for (int j = 0; j < srcCols; ++j) {
            idx = (i * srcCols * 4) + j * 4;

            // rgba to rgb
            uchar r = srcData[idx];
            uchar g = srcData[idx + 1];
            uchar b = srcData[idx + 2];
            // uchar a = srcData[idx + 3];

            // turn src image to gray scale
            gray[i][j] = (0.30 * r) + (0.59 * g) + (0.11 * b);
        }
    }

    Mat srcGray(srcRows, srcCols, CV_8UC1, gray);
    // GaussianBlur(srcGray, srcGray, Size(3,3), 2);

    if (initialized) {
        orb->detectAndCompute(srcGray, noArray(), kps1, descr1);

        vector<vector<DMatch>> knn_matches;
        desc_matcher->knnMatch(descr1, descr2, knn_matches, 2);

        vector<Point2f> dst_pts, src_pts;
        for (size_t i = 0; i < knn_matches.size(); ++i) {
            if (knn_matches[i][0].distance < GOOD_MATCH_PERCENT * knn_matches[i][1].distance) {
                dst_pts.push_back( kps1[knn_matches[i][0].queryIdx].pt );
                src_pts.push_back( kps2[knn_matches[i][0].trainIdx].pt );
            }
        }

        // printf("matches: %lu\n", dst_pts.size());

        // need at least 4 pts to define homography, rounded up to 10
        if (dst_pts.size() > 10) {
            H = findHomography(src_pts, dst_pts, RANSAC);
            perspectiveTransform(corners, warped, H);

            result[0] = H.at<double>(0,0);
            result[1] = H.at<double>(0,1);
            result[2] = H.at<double>(0,2);
            result[3] = H.at<double>(1,0);
            result[4] = H.at<double>(1,1);
            result[5] = H.at<double>(1,2);
            result[6] = H.at<double>(2,0);
            result[7] = H.at<double>(2,1);
            result[8] = H.at<double>(2,2);

            result[9]  = warped[0].x;
            result[10] = warped[0].y;
            result[11] = warped[1].x;
            result[12] = warped[1].y;
            result[13] = warped[2].x;
            result[14] = warped[2].y;
            result[15] = warped[3].x;
            result[16] = warped[3].y;
        }
    }

    return result;
}

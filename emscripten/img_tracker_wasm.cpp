#include <iostream>

#include <emscripten/emscripten.h>

#include <opencv2/opencv.hpp>
#include <opencv2/core.hpp>
#include <opencv2/core/types_c.h>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/calib3d/calib3d.hpp>
#include <opencv2/features2d.hpp>

#include "img_tracker_wasm.hpp"
#include "utils.hpp"

using namespace std;
using namespace cv;

#define GOOD_MATCH_RATIO    0.7f

bool initialized = false;

Ptr<AKAZE> akaze = NULL;
Ptr<BFMatcher> matcher = NULL;

Mat refGray, refDescr;
vector<KeyPoint> refKeyPts;

Mat H;
vector<Point2f> corners(4);

Mat prevIm;
int numMatches = 0;
vector<Point2f> framePts;

output_t *create_output() {
    output_t *output = new output_t;
    output->data = new double[OUTPUT_SIZE];
    return output;
}

output_t *output = create_output();

static inline void fill_output(Mat H, bool valid) {
    vector<Point2f> warped(4);
    perspectiveTransform(corners, warped, H);

    output->valid = valid;

    output->data[0] = H.at<double>(0,0);
    output->data[1] = H.at<double>(0,1);
    output->data[2] = H.at<double>(0,2);
    output->data[3] = H.at<double>(1,0);
    output->data[4] = H.at<double>(1,1);
    output->data[5] = H.at<double>(1,2);
    output->data[6] = H.at<double>(2,0);
    output->data[7] = H.at<double>(2,1);
    output->data[8] = H.at<double>(2,2);

    output->data[9]  = warped[0].x;
    output->data[10] = warped[0].y;
    output->data[11] = warped[1].x;
    output->data[12] = warped[1].y;
    output->data[13] = warped[2].x;
    output->data[14] = warped[2].y;
    output->data[15] = warped[3].x;
    output->data[16] = warped[3].y;
}

static inline void clear_output() {
    memset(output, 0, sizeof(output_t));
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
int initAR(uchar refData[], size_t refCols, size_t refRows) {
    akaze = AKAZE::create();
    matcher = BFMatcher::create();

    Mat refGray = Mat(refRows, refCols, CV_8UC1, refData);

    akaze->detectAndCompute(refGray, noArray(), refKeyPts, refDescr);

    // initialize reference image corners for warping
    corners[0] = cvPoint( 0, 0 );
    corners[1] = cvPoint( refCols, 0 );
    corners[2] = cvPoint( refCols, refRows );
    corners[3] = cvPoint( 0, refRows );

    initialized = true;
    cout << "Ready!" << endl;

    return 0;
}

EMSCRIPTEN_KEEPALIVE
output_t *resetTracking(uchar imageData[], size_t cols, size_t rows) {
    if (!initialized) {
        cout << "Reference image not found!" << endl;
        return NULL;
    }

    clear_output();

    Mat currIm = Mat(rows, cols, CV_8UC1, imageData);

    Mat frameDescr;
    vector<KeyPoint> frameKeyPts;
    akaze->detectAndCompute(currIm, noArray(), frameKeyPts, frameDescr);

    vector<vector<DMatch>> knnMatches;
    matcher->knnMatch(frameDescr, refDescr, knnMatches, 2);

    framePts.clear();
    vector<Point2f> refPts;
    // find the best matches
    for (size_t i = 0; i < knnMatches.size(); ++i) {
        if (knnMatches[i][0].distance < GOOD_MATCH_RATIO * knnMatches[i][1].distance) {
            framePts.push_back( frameKeyPts[knnMatches[i][0].queryIdx].pt );
            refPts.push_back( refKeyPts[knnMatches[i][0].trainIdx].pt );
        }
    }

    // need at least 4 pts to define homography
    if (framePts.size() > 15) {
        H = findHomography(refPts, framePts, RANSAC);
        bool valid;
        if ( (valid = homographyValid(H)) ) {
            numMatches = framePts.size();
            fill_output(H, valid);
            prevIm = currIm.clone();
        }
    }

    return output;
}

EMSCRIPTEN_KEEPALIVE
output_t *track(uchar imageData[], size_t cols, size_t rows) {
    if (!initialized) {
        cout << "Reference image not found!" << endl;
        return NULL;
    }

    if (prevIm.empty()) {
        cout << "Tracking is uninitialized!" << endl;
        return NULL;
    }

    clear_output();

    Mat currIm = Mat(rows, cols, CV_8UC1, imageData);
    // GaussianBlur(currIm, currIm, Size(3,3), 2);

    // use optical flow to track keypoints
    vector<float> err;
    vector<uchar> status;
    vector<Point2f> currPts, goodPtsCurr, goodPtsPrev;
    calcOpticalFlowPyrLK(prevIm, currIm, framePts, currPts, status, err);

    // calculate average variance
    double mean, avg_variance = 0.0;
    double sum = 0.0;
    double diff;
    vector<double> diffs;
    for (size_t i = 0; i < framePts.size(); ++i) {
        if (status[i]) {
            goodPtsCurr.push_back(currPts[i]);
            goodPtsPrev.push_back(framePts[i]);

            diff = sqrt(
                pow(currPts[i].x - framePts[i].x, 2.0) + pow(currPts[i].y - framePts[i].y, 2.0)
            );
            sum += diff;
            diffs.push_back(diff);
        }
    }

    mean = sum / diffs.size();
    for (int i = 0; i < goodPtsCurr.size(); ++i) {
        avg_variance += pow(diffs[i] - mean, 2);
    }
    avg_variance /= diffs.size();

    if ((goodPtsCurr.size() > numMatches/2) && (1.75 > avg_variance)) {
        Mat transform = estimateAffine2D(goodPtsPrev, goodPtsCurr);

        // add row of {0,0,1} to transform to make it 3x3
        Mat row = Mat::zeros(1, 3, CV_64F);
        row.at<double>(0,2) = 1.0;
        transform.push_back(row);

        // update homography matrix
        H = transform * H;

        // set old points to new points
        framePts = goodPtsCurr;

        bool valid;
        if ( (valid = homographyValid(H)) ) {
            fill_output(H, valid);
        }
    }

    prevIm = currIm.clone();

    return output;
}

}

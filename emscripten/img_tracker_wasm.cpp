#include <emscripten/emscripten.h>

#include <img_tracker_wasm.hpp>
#include <utils.hpp>

using namespace std;
using namespace cv;

ImageTracker::ImageTracker()
    : initialized(false)
    , frameWidth(0)
    , frameHeight(0)
    , numMatches(0)
    , output(nullptr)
{
    output = new output_t;
    output->data = new double[OUTPUT_SIZE];
}

ImageTracker::~ImageTracker() {
    if (output) {
        delete[] output->data;
        delete output;
    }
}

void ImageTracker::init(int width, int height) {
    frameWidth = width;
    frameHeight = height;
    orb = ORB::create(1500);
    matcher = BFMatcher::create(NORM_HAMMING);
}

void ImageTracker::setRefImage(unsigned char *refData, int refCols, int refRows) {
    Mat refIm = Mat(refRows, refCols, CV_8UC4, refData);
    cvtColor(refIm, refIm, COLOR_RGBA2GRAY);

    orb->detectAndCompute(refIm, noArray(), refKeyPts, refDescr);

    refCorners.resize(4);
    refCorners[0] = Point2f(0, 0);
    refCorners[1] = Point2f(refCols, 0);
    refCorners[2] = Point2f(refCols, refRows);
    refCorners[3] = Point2f(0, refRows);

    initialized = true;
}

output_t *ImageTracker::process(unsigned char *imageData, int cols, int rows) {
    if (!initialized) return nullptr;

    Mat currIm = Mat(rows, cols, CV_8UC4, imageData);
    Mat gray;
    cvtColor(currIm, gray, COLOR_RGBA2GRAY);

    clearOutput();

    if (prevGray.empty() || trackedPts.empty()) {
        detect(gray, cols, rows);
    }
    else {
        track(gray, cols, rows);
    }

    prevGray = gray.clone();

    return output;
}

// Full ORB detection + matching
output_t *ImageTracker::detect(Mat &gray, int cols, int rows) {
    Mat frameDescr;
    vector<KeyPoint> frameKeyPts;
    orb->detectAndCompute(gray, noArray(), frameKeyPts, frameDescr);

    if (frameDescr.empty()) return output;

    vector<vector<DMatch>> knnMatches;
    matcher->knnMatch(frameDescr, refDescr, knnMatches, 2);

    trackedPts.clear();
    vector<Point2f> refPts;

    for (size_t i = 0; i < knnMatches.size(); ++i) {
        if (knnMatches[i].size() >= 2 &&
            knnMatches[i][0].distance < GOOD_MATCH_RATIO * knnMatches[i][1].distance) {
            trackedPts.push_back(frameKeyPts[knnMatches[i][0].queryIdx].pt);
            refPts.push_back(refKeyPts[knnMatches[i][0].trainIdx].pt);
        }
    }

    if (trackedPts.size() >= MIN_GOOD_MATCHES) {
        homography = findHomography(refPts, trackedPts, RANSAC);
        vector<Point2f> warped(4);
        if (homographyValid(homography, refCorners, warped, cols, rows)) {
            numMatches = trackedPts.size();
            fillOutput(homography, warped);
            return output;
        }
    }

    // Detection failed, clear state so next frame retries detection
    trackedPts.clear();
    numMatches = 0;

    return output;
}

// Optical flow tracking between frames
output_t *ImageTracker::track(Mat &gray, int cols, int rows) {
    if (prevGray.empty() || trackedPts.empty()) {
        return detect(gray, cols, rows);
    }

    vector<float> err;
    vector<uchar> status;
    vector<Point2f> currPts, goodCurr, goodPrev;
    calcOpticalFlowPyrLK(prevGray, gray, trackedPts, currPts, status, err);

    // Filter good points and compute motion variance
    double sum = 0.0;
    vector<double> dists;
    for (size_t i = 0; i < trackedPts.size(); ++i) {
        if (status[i]) {
            goodCurr.push_back(currPts[i]);
            goodPrev.push_back(trackedPts[i]);

            double d = sqrt(
                pow(currPts[i].x - trackedPts[i].x, 2.0) +
                pow(currPts[i].y - trackedPts[i].y, 2.0)
            );
            sum += d;
            dists.push_back(d);
        }
    }

    if (dists.empty() || goodCurr.size() <= (size_t)(numMatches / 2)) {
        // Lost too many points, fall back to detection
        return detect(gray, cols, rows);
    }

    double mean = sum / dists.size();
    double variance = 0.0;
    for (size_t i = 0; i < dists.size(); ++i) {
        variance += pow(dists[i] - mean, 2);
    }
    variance /= dists.size();

    // Scale threshold with resolution (1.75 was tuned for 640x480)
    double varianceThreshold = 1.75 * (cols / 640.0);
    if (variance > varianceThreshold) {
        // Motion too erratic, fall back to detection
        return detect(gray, cols, rows);
    }

    Mat affine = estimateAffine2D(goodPrev, goodCurr);
    if (affine.empty()) return output;

    // Convert 2x3 affine to 3x3 by adding [0,0,1] row
    Mat lastRow = Mat::zeros(1, 3, CV_64F);
    lastRow.at<double>(0, 2) = 1.0;
    affine.push_back(lastRow);

    homography = affine * homography;
    trackedPts = goodCurr;

    vector<Point2f> warped(4);
    if (homographyValid(homography, refCorners, warped, cols, rows)) {
        fillOutput(homography, warped);
    }

    return output;
}

void ImageTracker::fillOutput(Mat &h, vector<Point2f> &warped) {
    output->valid = 1;

    output->data[0] = h.at<double>(0, 0);
    output->data[1] = h.at<double>(0, 1);
    output->data[2] = h.at<double>(0, 2);
    output->data[3] = h.at<double>(1, 0);
    output->data[4] = h.at<double>(1, 1);
    output->data[5] = h.at<double>(1, 2);
    output->data[6] = h.at<double>(2, 0);
    output->data[7] = h.at<double>(2, 1);
    output->data[8] = h.at<double>(2, 2);

    output->data[9]  = warped[0].x;
    output->data[10] = warped[0].y;
    output->data[11] = warped[1].x;
    output->data[12] = warped[1].y;
    output->data[13] = warped[2].x;
    output->data[14] = warped[2].y;
    output->data[15] = warped[3].x;
    output->data[16] = warped[3].y;
}

void ImageTracker::clearOutput() {
    output->valid = 0;
    memset(output->data, 0, OUTPUT_SIZE * sizeof(double));
}

static ImageTracker *tracker = nullptr;

extern "C" {

EMSCRIPTEN_KEEPALIVE
int initAR(unsigned char refData[], size_t refCols, size_t refRows) {
    if (!tracker) tracker = new ImageTracker();
    tracker->init(refCols, refRows);
    tracker->setRefImage(refData, refCols, refRows);
    return 0;
}

EMSCRIPTEN_KEEPALIVE
output_t *resetTracking(unsigned char imageData[], size_t cols, size_t rows) {
    if (!tracker) return nullptr;
    return tracker->process(imageData, cols, rows);
}

EMSCRIPTEN_KEEPALIVE
output_t *track(unsigned char imageData[], size_t cols, size_t rows) {
    if (!tracker) return nullptr;
    return tracker->process(imageData, cols, rows);
}

}

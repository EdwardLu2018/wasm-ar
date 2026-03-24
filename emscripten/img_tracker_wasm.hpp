#ifndef __IMG_TRACKER__
#define __IMG_TRACKER__

#include <opencv2/opencv.hpp>
#include <opencv2/features2d.hpp>
#include <opencv2/calib3d.hpp>
#include <opencv2/video.hpp>

#define OUTPUT_SIZE     17
#define GOOD_MATCH_RATIO    0.75f
#define MIN_GOOD_MATCHES    6
// output struct passed back to JS via pointer
// layout: [valid (1 byte)] [3 bytes padding] [data pointer (4 bytes on wasm32)]
typedef struct {
    char valid;
    double *data; // 9 homography + 8 warped corners
} output_t;

class ImageTracker {
public:
    ImageTracker();
    ~ImageTracker();

    void init(int width, int height);
    void setRefImage(unsigned char *refData, int refCols, int refRows);
    output_t *process(unsigned char *imageData, int cols, int rows);

private:
    output_t *detect(cv::Mat &gray, int cols, int rows);
    output_t *track(cv::Mat &gray, int cols, int rows);
    void fillOutput(cv::Mat &homography, std::vector<cv::Point2f> &warped);
    void clearOutput();

    bool initialized;
    int frameWidth;
    int frameHeight;

    cv::Ptr<cv::ORB> orb;
    cv::Ptr<cv::BFMatcher> matcher;

    cv::Mat refDescr;
    std::vector<cv::KeyPoint> refKeyPts;
    std::vector<cv::Point2f> refCorners;

    cv::Mat homography;
    cv::Mat prevGray;
    int numMatches;
    std::vector<cv::Point2f> trackedPts;

    output_t *output;
};

#endif

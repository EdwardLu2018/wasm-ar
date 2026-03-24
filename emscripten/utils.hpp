#ifndef __UTILS__
#define __UTILS__

#include <vector>
#include <opencv2/opencv.hpp>

bool homographyValid(cv::Mat H, std::vector<cv::Point2f> &corners,
                     std::vector<cv::Point2f> &warped, int frameCols, int frameRows);

#endif

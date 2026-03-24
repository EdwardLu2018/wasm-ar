#include <cmath>
#include <opencv2/opencv.hpp>

#include <utils.hpp>

using namespace std;
using namespace cv;

#define N 10

static double cross2d(Point2f a, Point2f b, Point2f c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

bool homographyValid(Mat H, vector<Point2f> &corners, vector<Point2f> &warped,
                     int frameCols, int frameRows) {
    if (H.empty()) return false;

    // determinant check
    const double det = H.at<double>(0,0) * H.at<double>(1,1) -
                       H.at<double>(1,0) * H.at<double>(0,1);
    if (fabs(det) < 1.0 / N || fabs(det) > N) return false;

    // warp corners and check bounds
    perspectiveTransform(corners, warped, H);
    for (int i = 0; i < 4; i++) {
        if (warped[i].x < -frameCols || warped[i].x > 2 * frameCols) return false;
        if (warped[i].y < -frameRows || warped[i].y > 2 * frameRows) return false;
    }

    // must be convex (all cross products same sign)
    double c0 = cross2d(warped[0], warped[1], warped[2]);
    double c1 = cross2d(warped[1], warped[2], warped[3]);
    double c2 = cross2d(warped[2], warped[3], warped[0]);
    double c3 = cross2d(warped[3], warped[0], warped[1]);
    if (!(c0 > 0 && c1 > 0 && c2 > 0 && c3 > 0) &&
        !(c0 < 0 && c1 < 0 && c2 < 0 && c3 < 0)) return false;

    // area must be reasonable
    double area = fabs(c0 + c2) / 2.0;
    double frameArea = frameCols * frameRows;
    if (area < 400 || area > frameArea * 2) return false;

    return true;
}

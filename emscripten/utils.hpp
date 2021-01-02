#ifndef __UTILS__
#define __UTILS__

using namespace std;
using namespace cv;

bool homographyValid(Mat H);
void drawKeypointsOnCanv(vector<KeyPoint> keyPts, const char *canvasId, const char *color);

#endif

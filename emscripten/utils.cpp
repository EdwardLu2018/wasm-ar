#include <iostream>

#include <emscripten/emscripten.h>

#include <opencv2/opencv.hpp>
#include <opencv2/features2d.hpp>

#include "utils.hpp"

#define N   10

bool homographyValid(Mat H) {
    const double det = H.at<double>(0,0)*H.at<double>(1,1)-H.at<double>(1,0)*H.at<double>(0,1);
    return 1/N < fabs(det) && fabs(det) < N;
}

void drawKeypointsOnCanv(vector<KeyPoint> keyPts, const char *canvasId, const char *color) {
    for (int i = 0; i < keyPts.size(); i++) {
        EM_ASM({
            const canvasId = UTF8ToString($0);
            const color = UTF8ToString($1);
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = color;
            ctx.fillRect($2, $3, 1, 1);
        }, canvasId, color, keyPts[i].pt.x, keyPts[i].pt.y);
    }
}

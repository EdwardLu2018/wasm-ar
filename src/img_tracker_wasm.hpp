#ifndef __IMG_TRACKER__
#define __IMG_TRACKER__

#define OUTPUT_SIZE     17

typedef struct {
    char valid;
    double *data;   // 9 elems in homography matrix + 8 elems in warped corners
} output_t;

#endif

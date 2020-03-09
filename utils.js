const writeImToCanv = (src, dstCanvas) => {
    const tmpMat = new cv.Mat(src);
    if (tmpMat.type() === cv.CV_8UC1) {
        cv.cvtColor(tmpMat, tmpMat, cv.COLOR_GRAY2RGBA);
    }
    else if (tmpMat.type() === cv.CV_8UC3) {
        cv.cvtColor(tmpMat, tmpMat, cv.COLOR_RGB2RGBA);
    }
    const imgData = new ImageData(
        new Uint8ClampedArray(tmpMat.data),
        tmpMat.cols,
        tmpMat.rows
    );
    const ctx = dstCanvas.getContext("2d");
    dstCanvas.width = tmpMat.cols;
    dstCanvas.height = tmpMat.rows;
    ctx.putImageData(imgData, 0, 0);
    tmpMat.delete();
};

const readImFromCanv = (canvas) => {
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return cv.matFromImageData(imgData)
};

const create4ChanMat = (mat) => {
    if (mat.channels() == 4) return mat;

    const width = mat.size().width, height = mat.size().height;
    let result = new cv.Mat();
    let vec = new cv.MatVector();

    for (var i=0; i<3; i++)
        vec.push_back(mat);
    vec.push_back(new cv.Mat(height, width, cv.CV_32FC1, [1,1,1,1]))
    cv.merge(vec, result);

    vec.delete();

    return result;
};

export default { readImFromCanv, writeImToCanv, create4ChanMat };

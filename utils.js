const getImgData = (imName) => {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var refImg = document.getElementById(imName);
    canvas.width = refImg.width;
    canvas.height = refImg.height;

    ctx.drawImage(refImg, 0, 0);
    return ctx.getImageData(0, 0, refImg.width, refImg.height).data;
}

export { getImgData };

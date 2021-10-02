export class ImageTrackerSource {
    constructor(options) {
        this.options = {
            width: 640,
            height: 480,
        }
        this.setOptions(options);

        this.video = document.createElement("video");
        this.video.setAttribute("autoplay", "");
        this.video.setAttribute("muted", "");
        this.video.setAttribute("playsinline", "");
        this.video.style.width = this.options.width + "px";
        this.video.style.height = this.options.height + "px";

        this.video.style.position = "absolute";
        this.video.style.top = "0px";
        this.video.style.left = "0px";
        this.video.style.zIndex = "9998";
    }

    setOptions(options) {
        if (options) {
            this.options = Object.assign(this.options, options);
        }
    }

    resize(width, height) {
        var screenWidth = width;
        var screenHeight = height;

        var sourceWidth = this.video.videoWidth;
        var sourceHeight = this.video.videoHeight;

        var sourceAspect = sourceWidth / sourceHeight;
        var screenAspect = screenWidth / screenHeight;

        if (screenAspect < sourceAspect) {
            var newWidth = sourceAspect * screenHeight;
            this.video.style.width = newWidth + "px";
            this.video.style.marginLeft = -(newWidth - screenWidth) / 2 + "px";

            this.video.style.height = screenHeight + "px";
            this.video.style.marginTop = "0px";
        } else {
            var newHeight = 1 / (sourceAspect / screenWidth);
            this.video.style.height = newHeight + "px";
            this.video.style.marginTop = -(newHeight - screenHeight) / 2 + "px";

            this.video.style.width = screenWidth + "px";
            this.video.style.marginLeft = "0px";
        }
    }

    copyDimensionsTo(elem) {
        elem.width = this.options.width;
        elem.height = this.options.height;
        elem.style.width = this.video.style.width;
        elem.style.height = this.video.style.height;
        elem.style.position = this.video.style.position;
        elem.style.top = this.video.style.top;
        elem.style.left = this.video.style.left;
    }

    init(cameraOptions) {
        return new Promise((resolve, reject) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
                return reject();

            navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: "environment",
                    width: { ideal: this.options.width },
                    height: { ideal: this.options.height },
                    ...cameraOptions
                },
            })
            .then((stream) => {
                this.video.srcObject = stream;
                this.video.onloadedmetadata = (e) => {
                    this.video.play();
                    resolve(this.video);
                };
            })
            .catch((err) => {
                reject(err);
            });
        });
    }
}

export class ImageTracker {
    constructor(source) {
        this.running = false;

        this.source = source;
        this.sourceWidth = this.source.options.width;
        this.sourceHeight = this.source.options.height;

        this.worker = new Worker(new URL('./img-tracker.worker.js', import.meta.url));
    }

    init() {
        this.source.init()
            .then((source) => {
                this.onInit(source);
            })
            .catch((err) => {
                console.error("Camera init failed: " + err);
            });
    }

    onInit(source) {
        window.dispatchEvent(new CustomEvent("onWasmARStatus", {
            detail: { message: "Loading WASM module..." }
        }));

        this.worker.postMessage({
            type: "init",
            width: this.sourceWidth,
            height: this.sourceHeight,
        });

        const _this = this;
        this.worker.onmessage = function (e) {
            var msg = e.data;
            switch (msg.type) {
                case "loaded": {
                    const initEvent = new CustomEvent(
                        "onWasmARInit",
                        {detail: {source: source}}
                    );
                    window.dispatchEvent(initEvent);
                    break;
                }
                case "refImLoaded": {
                    break;
                }
                case "result": {
                    const H = msg.H;
                    const corners = msg.corners;
                    const hEvent = new CustomEvent(
                        "onWasmARHomography", { detail: { H: H, corners: corners } }
                    );
                    window.dispatchEvent(hEvent);
                    break;
                }
                case "not found": {
                    window.dispatchEvent(new CustomEvent("onWasmARNotFound"));
                    break;
                }
                default: {
                    break;
                }
            }
        }

        this.worker.onerror = e => {
            console.error(e);
        }
    }

    addRefIm(refIm, refImWidth, refImHeight) {
        var canvas = document.createElement('canvas');
        canvas.width = refImWidth;
        canvas.height = refImHeight;

        var context = canvas.getContext('2d');
        context.drawImage(refIm, 0, 0, refImWidth, refImHeight);
        var refImData = context.getImageData(0, 0, refImWidth, refImHeight);

        this.worker.postMessage({
            type: "refIm",
            imagedata: refImData.data,
            width: refImWidth,
            height: refImHeight
        });
    }

    findHomography(imageData) {
        this.worker.postMessage({
            type: 'process',
            imagedata: imageData
        });
    }
}

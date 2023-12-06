import {Preprocessor} from "./preprocessor";

export class ImageTracker {
    constructor(source) {
        this.running = false;

        this.source = source;
        this.sourceWidth = this.source.options.width;
        this.sourceHeight = this.source.options.height;

        this.grayBuf = new Uint8Array(this.sourceWidth * this.sourceHeight);

        this.preprocessor = new Preprocessor(this.sourceWidth, this.sourceHeight);
        this.worker = new Worker(new URL('./img-tracker.worker.js', import.meta.url));
    }

    init() {
        this.source.init()
            .then((source) => {
                this.preprocessor.attachElem(source);
                this.onInit(source);
            })
            .catch((err) => {
                console.warn("ERROR: " + err);
            });
    }

    onInit(source) {
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
                    const hEvent = new CustomEvent(
                        "onWasmARHomography", { detail: { H: H } }
                    );
                    window.dispatchEvent(hEvent);
                    break;
                }
                case "not found": {
                    break;
                }
                default: {
                    break;
                }
            }
            // _this.process();
        }

        this.worker.onerror = e => {
            console.error(e);
        }
    }

    addRefIm(refIm, refImWidth, refImHeight) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.drawImage(refIm, 0, 0 );
        var refImData = context.getImageData(0, 0, refImWidth, refImHeight).data;

        this.worker.postMessage({
            type: "refIm",
            imagedata: refImData,
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

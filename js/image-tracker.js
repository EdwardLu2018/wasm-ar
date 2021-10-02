import {Preprocessor} from "./preprocessor";
import Worker from "./img-tracker.worker";

export class ImageTracker {
    constructor(source) {
        this.running = false;

        this.source = source;
        this.sourceWidth = this.source.options.width;
        this.sourceHeight = this.source.options.height;

        this.grayBuf = new Uint8Array(this.sourceWidth * this.sourceHeight);

        this.preprocessor = new Preprocessor(this.sourceWidth, this.sourceHeight);
        this.worker = new Worker();
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
        const initEvent = new CustomEvent(
            "onWasmARInit",
            {detail: {source: source}}
        );
        window.dispatchEvent(initEvent);

        const _this = this;
        this.worker.onmessage = function (e) {
            var msg = e.data;
            switch (msg.type) {
                case "loaded": {
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
    }

    addRefIm(refIm, refImWidth, refImHeight) {
        this.worker.postMessage({
            type: "refIm",
            imagedata: refIm,
            width: refImWidth,
            height: refImHeight
        }, [refIm]);
    }

    findHomography(imageData) {
        this.worker.postMessage({
            type: 'process',
            imagedata: imageData
        });
    }
}

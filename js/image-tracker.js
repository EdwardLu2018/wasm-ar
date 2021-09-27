const N = 10;

export class ImageTracker {
    constructor(width, height, callback) {
        let _this = this;

        this._width = width;
        this._height = height;

        this.valid = false;

        ImageTrackerWASM().then(function (Module) {
            console.log("WASM module loaded.");
            _this.onWasmInit(Module);
            if (callback) callback();
        });
    }

    onWasmInit(Module) {
        this._Module = Module;

        this._init = this._Module.cwrap("initAR", "number", ["number", "number", "number"]);
        this._resetTracking = this._Module.cwrap("resetTracking", "number", ["number", "number", "number"]);
        this._track = this._Module.cwrap("track", "number", ["number", "number", "number"]);

        this.imPtr = this._Module._malloc(this._width * this._height);
    }

    addRefIm(refIm, refImWidth, refImHeight) {
        return new Promise((resolve, reject) => {
            this.refImPtr = this._Module._malloc(refIm.length);
            this._Module.HEAPU8.set(refIm, this.refImPtr);
            this._init(this.refImPtr, refImWidth, refImHeight);
            resolve();
        });
    }

    parseResult(ptr) {
        const valid = this._Module.getValue(ptr, "i8");
        const dataPtr = this._Module.getValue(ptr + 4, "*");
        let data = new Float64Array(this._Module.HEAPF64.buffer, dataPtr, 17);

        const h = data.slice(0, 9);
        const warped = data.slice(9, 17);

        return {
            valid: valid,
            H: h,
            corners: warped
        };
    }

    resetTracking(im) {
        this._Module.HEAPU8.set(im, this.imPtr);
        const res = this._resetTracking(this.imPtr, this._width, this._height);

        const resObj = this.parseResult(res);
        this.valid = resObj.valid;
        return resObj;
    }

    track(im) {
        // reset tracking if homography is no long valid
        if (!this.valid) {
            return this.resetTracking(im, this._width, this._height);
        }
        this._Module.HEAPU8.set(im, this.imPtr);
        const res = this._track(this.imPtr, this._width, this._height);

        const resObj = this.parseResult(res);
        this.valid = resObj.valid;
        return resObj;
    }
}

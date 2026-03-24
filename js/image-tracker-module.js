import ImageTrackerWASM from "../build/img_tracker_wasm";

export class ImageTrackerModule {
    constructor(width, height, callback) {
        let _this = this;

        this._width = width;
        this._height = height;

        this.valid = false;

        ImageTrackerWASM().then(function(Module) {
            console.log("WASM module loaded!");
            _this.onWasmInit(Module);
            if (callback) callback();
        });
    }

    onWasmInit(Module) {
        this._Module = Module;

        this._initAR = this._Module.cwrap("initAR", "number", ["number", "number", "number"]);
        this._resetTracking = this._Module.cwrap("resetTracking", "number", ["number", "number", "number"]);
        this._track = this._Module.cwrap("track", "number", ["number", "number", "number"]);

        this.imPtr = this._Module._malloc(this._width * this._height * 4);
    }

    addRefIm(refImData, refImWidth, refImHeight) {
        if (this.refImPtr) this._Module._free(this.refImPtr);
        this.refImPtr = this._Module._malloc(refImWidth * refImHeight * 4);
        this._Module.HEAPU8.set(refImData, this.refImPtr);
        this._initAR(this.refImPtr, refImWidth, refImHeight);
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
            corners: [
                {x: warped[0], y: warped[1]},
                {x: warped[2], y: warped[3]},
                {x: warped[4], y: warped[5]},
                {x: warped[6], y: warped[7]},
            ]
        };
    }

    resetTracking(imData) {
        this._Module.HEAPU8.set(imData, this.imPtr);
        const res = this._resetTracking(this.imPtr, this._width, this._height);
        const resObj = this.parseResult(res);
        this.valid = resObj.valid;
        return resObj;
    }

    track(imData) {
        this._Module.HEAPU8.set(imData, this.imPtr);

        // reset tracking if homography is no longer valid
        if (!this.valid) {
            return this.resetTracking(imData);
        }

        const res = this._track(this.imPtr, this._width, this._height);
        const resObj = this.parseResult(res);
        this.valid = resObj.valid;
        return resObj;
    }

    destroy() {
        if (this._Module) {
            if (this.imPtr) this._Module._free(this.imPtr);
            if (this.refImPtr) this._Module._free(this.refImPtr);
            this.imPtr = null;
            this.refImPtr = null;
        }
    }
}

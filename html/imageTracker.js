const N = 10;

class ImageTracker {
    constructor(callback) {
        let _this = this;
        this.validPoints = false;
        ARWasm().then(function (Module) {
            console.log("AR WASM module loaded.");
            _this.onWasmInit(Module);
            if (callback) callback();
        });
    }

    onWasmInit(Module) {
        this._Module = Module;
        this._init = this._Module.cwrap("_Z6initARPhmm", "number", ["number", "number", "number"]);
        this._resetTracking = this._Module.cwrap("_Z13resetTrackingPhmm", "number", ["number", "number", "number"]);
        this._track = this._Module.cwrap("_Z5trackPhmm", "number", ["number", "number", "number"]);
    }

    createImBuf(imArr) {
        const imPtr = this._Module._malloc(imArr.length);
        this._Module.HEAPU8.set(imArr, imPtr);
        return imPtr;
    }

    init(refImArr, width, height) {
        const refImPtr = this.createImBuf(refImArr);
        this._init(refImPtr, width, height);
        this._Module._free(refImPtr);
    }

    validHomography(h) {
        const det = h[0]*h[4]-h[1]*h[3]; // check if determinant of top left 2x2 is valid
        return (1/N < Math.abs(det) && Math.abs(det) < N);
    }

    parseResult(ptr) {
        const ptrF64 = ptr / Float64Array.BYTES_PER_ELEMENT;

        let i = 0;

        const h = [];
        for (; i < 9; i++) {
            h.push(this._Module.HEAPF64[ptrF64+i]);
        }

        const warped = [];
        for (; i < 17; i++) {
            warped.push(this._Module.HEAPF64[ptrF64+i]);
        }

        return {
            valid: this.validHomography(h),
            H: h,
            corners: warped
        };
    }

    resetTracking(imArr, width, height) {
        const imPtr = this.createImBuf(imArr);
        const res = this._resetTracking(imPtr, width, height);
        this._Module._free(imPtr);

        const resObj = this.parseResult(res);
        this.validPoints = resObj.valid;
        return resObj;
    }

    track(imArr, width, height) {
        if (!this.validPoints) {
            return this.resetTracking(imArr, width, height);
        }
        const imPtr = this.createImBuf(imArr);
        const res = this._track(imPtr, width, height);
        this._Module._free(imPtr);

        const resObj = this.parseResult(res);
        this.validPoints = resObj.valid;
        return resObj;
    }

    transformElem(h, elem) {
        // column major order
        let transform = [h[0], h[3], 0, h[6],
                         h[1], h[4], 0, h[7],
                          0  ,  0  , 1,  0  ,
                         h[2], h[5], 0, h[8]];
        transform = "matrix3d("+transform.join(",")+")";
        elem.style["-ms-transform"] = transform;
        elem.style["-webkit-transform"] = transform;
        elem.style["-moz-transform"] = transform;
        elem.style["-o-transform"] = transform;
        elem.style.transform = transform;
        elem.style.display = "block";
    }
}

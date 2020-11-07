class ImageTracker {
    constructor(callback) {
        let _this = this;
        this.ready = false;
        this.shouldTrack = false;
        this.validPoints = false;
        ARWasm().then(function (Module) {
            console.log("AR WASM module loaded.");
            _this.onWasmInit(Module);
            if (callback) {
                callback();
            }
        });
    }

    onWasmInit(Module) {
        this._Module = Module;
    }

    init(ref_arr, width, height) {
        const ref_ptr = this._Module._malloc(ref_arr.length);
        this._Module.HEAPU8.set(ref_arr, ref_ptr);

        this._Module.ccall(
            "_Z6initARPhmm",
            null,
            ["number", "number", "number"],
            [ref_ptr, width, height]
        );

        this._Module._free(ref_ptr);

        this.ready = true;
    }

    validHomography(h) {
        const N = 10;
        // check if determinant of top left 2x2 is valid
        const det = h[0]*h[4]-h[1]*h[3];
        return (1/N < Math.abs(det) && Math.abs(det) < N);
    }

    callWasm(name, im_arr, width, height) {
        if (!this.ready || !this.shouldTrack) return [false, null, null];

        const im_ptr = this._Module._malloc(im_arr.length);
        this._Module.HEAPU8.set(im_arr, im_ptr);

        const ptr = this._Module.ccall(
            name,
            "number",
            ["number", "number", "number"],
            [im_ptr, width, height]
        );
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

        this._Module._free(ptr);
        this._Module._free(im_ptr);

        return [this.validHomography(h), h, warped];
    }

    resetTracking(im_arr, width, height) {
        const [valid, h, warped] = this.callWasm("_Z13resetTrackingPhmm", im_arr, width, height);
        this.validPoints = valid;
        return [valid, h, warped];
    }

    track(im_arr, width, height) {
        if (!this.validPoints) {
            return this.resetTracking(im_arr, width, height);
        }

        const [valid, h, warped] = this.callWasm("_Z5trackPhmm", im_arr, width, height);
        this.validPoints = valid;

        return [valid, h, warped];
    }

    performTransform(h, elem) {
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

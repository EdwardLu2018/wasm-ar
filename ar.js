class Homography {
    constructor(callback) {
        let _this = this;
        this.ready = false;
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

    performAR(im_arr, width, height) {
        if (!this.ready) return null;

        const im_ptr = this._Module._malloc(im_arr.length);
        this._Module.HEAPU8.set(im_arr, im_ptr);

        console.time("performAR")
        const ptr = this._Module.ccall(
            "_Z9performARPhmm",
            "number",
            ["number", "number", "number"],
            [im_ptr, width, height]
        );
        console.timeEnd("performAR")
        const ptrF64 = ptr / Float64Array.BYTES_PER_ELEMENT;

        let i = 0
        const H = [];
        for (; i < 9; i++) {
            H.push(this._Module.HEAPF64[ptrF64+i]);
        }

        const warped = [];
        for (; i < 17; i++) {
            warped.push(this._Module.HEAPF64[ptrF64+i]);
        }

        this._Module._free(ptr);
        this._Module._free(im_ptr);

        return [H, warped];
    }
}

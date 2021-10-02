import {GLUtils} from './utils/gl-utils';

const DEFAULT_BUFFER_SIZE = 1;

export class Preprocessor {
    constructor(width, height, canvas, numberOfBuffers=DEFAULT_BUFFER_SIZE) {
        this.width = width;
        this.height = height;

        this.canvas = canvas ? canvas : document.createElement("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this._gl = GLUtils.createGL(this.canvas);

        const flipProg = require("./shaders/vertex-shader.glsl");
        const grayProg = require("./shaders/grayscale.glsl");
        const program = GLUtils.createProgram(this._gl, flipProg, grayProg);
        GLUtils.useProgram(this._gl, program);

        this._texSizeLocation = this._gl.getUniformLocation(program, "texSize");
        this._gl.uniform2f(this._texSizeLocation, this.width, this.height);

        this._texture = GLUtils.createTexture(this._gl, this.width, this.height);
        GLUtils.bindTexture(this._gl, this._texture);

        this._pixelBuffer = (new Array(numberOfBuffers)).fill(null).map(() => new Uint8Array(this.width * this.height * 4));
        this._consumerQueue = (new Array(numberOfBuffers)).fill(0).map((_, i) => i);
        this._producerQueue = [];

        this._pbo = null;
    }

    async getPixels() {
        if (!this._source) return null;

        GLUtils.bindElem(this._gl, this._source);
        GLUtils.draw(this._gl, this.width, this.height);

        // adopted from:
        // https://github.com/alemart/speedy-vision-js/blob/master/src/gpu/speedy-texture-reader.js
        const pbo = this._gl.isBuffer(this._pbo) ?
                    this._pbo : (this._pbo = GLUtils.createBuffer(this._gl));

        if (this._producerQueue.length > 0) {
            const nextBufferIndex = this._producerQueue.shift();
            GLUtils.readPixelsAsync(this._gl, pbo, this.width, this.height, this._pixelBuffer[nextBufferIndex])
                .then(() => {
                    this._consumerQueue.push(nextBufferIndex);
                });
        }
        else this._waitForQueueNotEmpty(this._producerQueue).then(() => {
            const nextBufferIndex = this._producerQueue.shift();
            GLUtils.readPixelsAsync(this._gl, pbo, this.width, this.height, this._pixelBuffer[nextBufferIndex])
                .then(() => {
                    this._consumerQueue.push(nextBufferIndex);
                });
        });

        if (this._consumerQueue.length > 0) {
            const readyBufferIndex = this._consumerQueue.shift();
            return new Promise(resolve => {
                resolve(this._pixelBuffer[readyBufferIndex]);
                this._producerQueue.push(readyBufferIndex); // enqueue AFTER resolve()
            });
        }
        else return new Promise(resolve => {
            this._waitForQueueNotEmpty(this._consumerQueue).then(() => {
                const readyBufferIndex = this._consumerQueue.shift();
                resolve(this._pixelBuffer[readyBufferIndex]);
                this._producerQueue.push(readyBufferIndex); // enqueue AFTER resolve()
            });
        });
    }

    // adopted from:
    // https://github.com/alemart/speedy-vision-js/blob/master/src/gpu/speedy-texture-reader.js
    _waitForQueueNotEmpty(queue) {
        return new Promise(resolve => {
            (function wait() {
                if(queue.length > 0)
                    resolve();
                else
                    setTimeout(wait, 0);
            })();
        });
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        GLUtils.resize(this._gl);
        this._gl.uniform2f(this._textureSizeLocation, this.width, this.height);

        for (let i = 0; i < this._pixelBuffer.length; i++) {
            const newBuffer = new Uint8Array(this.width * this.height * 4);
            // newBuffer.set(this._pixelBuffer[i]);
            this._pixelBuffer[i] = newBuffer;
        }
    }

    attachElem(source) {
        this._source = source;
        GLUtils.bindElem(this._gl, this._source);
    }
}

export class GrayScaleMedia
{
    constructor(source, width, height, canvas) {
        this._source = source;
        this._width = width;
        this._height = height;
        this._canvas = canvas ? canvas : document.createElement("canvas");
        this._canvas.width = width;
        this._canvas.height = height;

        this._flipImageProg = require("./shaders/flip-image.glsl");
        this._grayscaleProg = require("./shaders/grayscale.glsl");
        this.glReady = false;
        this.initGL(this._flipImageProg, this._grayscaleProg);
    }

    initGL(vertShaderSource, fragShaderSource) {
        this.gl = this._canvas.getContext("webgl");

        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        this.gl.shaderSource(vertShader, vertShaderSource);
        this.gl.shaderSource(fragShader, fragShaderSource);

        this.gl.compileShader(vertShader);
        this.gl.compileShader(fragShader);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertShader);
        this.gl.attachShader(program, fragShader);

        this.gl.linkProgram(program);

        this.gl.useProgram(program);

        const vertices = new Float32Array([
            -1, -1,
            -1,  1,
             1,  1,
            -1, -1,
             1,  1,
             1, -1,
        ]);

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(program, "position");
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionLocation);

        this.flipLocation = this.gl.getUniformLocation(program, "flipY");

        const texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // if either dimension of image is not a power of 2
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.glReady = true;
        this.pixelBuf = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight * 4);
        this.grayBuf = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight);
    }

    getFrame() {
        if (!this.glReady) return undefined;

        this.gl.uniform1f(this.flipLocation, -1); // flip image
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this._source);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        this.gl.readPixels(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.pixelBuf);

        let j = 0;
        for (let i = 0; i < this.pixelBuf.length; i += 4) {
            this.grayBuf[j] = this.pixelBuf[i];
            j++;
        }
        return this.grayBuf;
    }

    requestStream() {
        return new Promise((resolve, reject) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
                return reject();

            navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: "environment",
                    width: { ideal: this._width },
                    height: { ideal: this._height }
                }
            })
            .then(stream => {
                this._source.srcObject = stream;
                this._source.onloadedmetadata = e => {
                    this._source.play();
                    resolve(this._source);
                };
            })
            .catch(err => {
                reject(err);
            });
        });
    }
}

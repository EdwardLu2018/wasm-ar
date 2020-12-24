var WasmAR =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./html/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./html/grayscale.js":
/*!***************************!*\
  !*** ./html/grayscale.js ***!
  \***************************/
/*! exports provided: GrayScale */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GrayScale", function() { return GrayScale; });
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/typeof */ "./node_modules/@babel/runtime/helpers/typeof.js");
/* harmony import */ var _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ "./node_modules/@babel/runtime/helpers/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ "./node_modules/@babel/runtime/helpers/createClass.js");
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_2__);



var GrayScale = /*#__PURE__*/function () {
  function GrayScale(source, width, height, canvas) {
    _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1___default()(this, GrayScale);

    this._source = source;
    this._sourceType = _babel_runtime_helpers_typeof__WEBPACK_IMPORTED_MODULE_0___default()(this._source);
    this._width = width;
    this._height = height;
    this._canvas = canvas ? canvas : document.createElement("canvas");
    this._canvas.width = width;
    this._canvas.height = height;
    this._flipImageProg = __webpack_require__(/*! ./shaders/flip-image.glsl */ "./html/shaders/flip-image.glsl");
    this._grayscaleProg = __webpack_require__(/*! ./shaders/grayscale.glsl */ "./html/shaders/grayscale.glsl");
    this.glReady = false;
    this.initGL(this._flipImageProg, this._grayscaleProg);
  }

  _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_2___default()(GrayScale, [{
    key: "initGL",
    value: function initGL(vertShaderSource, fragShaderSource) {
      this.gl = this._canvas.getContext("webgl");
      this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
      this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      var vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);
      var fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
      this.gl.shaderSource(vertShader, vertShaderSource);
      this.gl.shaderSource(fragShader, fragShaderSource);
      this.gl.compileShader(vertShader);
      this.gl.compileShader(fragShader);
      var program = this.gl.createProgram();
      this.gl.attachShader(program, vertShader);
      this.gl.attachShader(program, fragShader);
      this.gl.linkProgram(program);
      this.gl.useProgram(program);
      var vertices = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
      var buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
      var positionLocation = this.gl.getAttribLocation(program, "position");
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
      this.gl.enableVertexAttribArray(positionLocation);
      var texture = this.gl.createTexture();
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture); // if either dimension of image is not a power of 2

      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      this.glReady = true;
      this.pixelBuf = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight * 4);
      this.grayBuf = new Uint8Array(this.gl.drawingBufferWidth * this.gl.drawingBufferHeight);
    }
  }, {
    key: "getFrame",
    value: function getFrame() {
      if (!this.glReady) return undefined;
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this._source);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
      this.gl.readPixels(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.pixelBuf);
      var j = 0;

      for (var i = 0; i < this.pixelBuf.length; i += 4) {
        this.grayBuf[j] = this.pixelBuf[i];
        j++;
      }

      return this.grayBuf;
    }
  }, {
    key: "requestStream",
    value: function requestStream() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return reject();
        var width = _this._width;
        var height = _this._height; // check for mobile orientation

        if (window.orientation) {
          if (window.orientation == 90 || window.orientation == -90) {
            width = Math.max(width, height);
            height = Math.min(width, height);
          } else {
            width = Math.min(width, height);
            height = Math.max(width, height);
          }
        }

        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            width: {
              ideal: height
            },
            height: {
              ideal: width
            },
            aspectRatio: {
              ideal: height / width
            },
            facingMode: "environment",
            frameRate: 30
          }
        }).then(function (stream) {
          _this._source.srcObject = stream;

          _this._source.onloadedmetadata = function (e) {
            _this._source.play();

            resolve(_this._source, stream);
          };
        })["catch"](function (err) {
          console.warn("ERROR: " + err);
        });
      });
    }
  }]);

  return GrayScale;
}();

/***/ }),

/***/ "./html/imageTracker.js":
/*!******************************!*\
  !*** ./html/imageTracker.js ***!
  \******************************/
/*! exports provided: ImageTracker */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ImageTracker", function() { return ImageTracker; });
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ "./node_modules/@babel/runtime/helpers/classCallCheck.js");
/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ "./node_modules/@babel/runtime/helpers/createClass.js");
/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__);


var N = 10;
var ImageTracker = /*#__PURE__*/function () {
  function ImageTracker(width, height, callback) {
    _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default()(this, ImageTracker);

    var _this = this;

    this._width = width;
    this._height = height;
    this.validPoints = false;
    ARWasm().then(function (Module) {
      console.log("AR WASM module loaded.");

      _this.onWasmInit(Module);

      if (callback) callback();
    });
  }

  _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1___default()(ImageTracker, [{
    key: "onWasmInit",
    value: function onWasmInit(Module) {
      this._Module = Module;
      this._init = this._Module.cwrap("_Z6initARPhmm", "number", ["number", "number", "number"]);
      this._resetTracking = this._Module.cwrap("_Z13resetTrackingPhmm", "number", ["number", "number", "number"]);
      this._track = this._Module.cwrap("_Z5trackPhmm", "number", ["number", "number", "number"]);
      this.imPtr = this._Module._malloc(this._width * this._height);
    }
  }, {
    key: "init",
    value: function init(refImArr, refImWidth, refImHeight) {
      this.refImPtr = this._Module._malloc(refImArr.length);

      this._Module.HEAPU8.set(refImArr, this.refImPtr);

      this._init(this.refImPtr, refImWidth, refImHeight); // this._Module._free(this.refImPtr);

    }
  }, {
    key: "parseResult",
    value: function parseResult(ptr) {
      var valid = this._Module.getValue(ptr, "i8");

      var dataPtr = this._Module.getValue(ptr + 4, "*");

      var data = new Float64Array(this._Module.HEAPF64.buffer, dataPtr, 17);
      var h = data.slice(0, 9);
      var warped = data.slice(9, 17);
      console.log(warped);
      return {
        valid: valid,
        H: h,
        corners: warped
      };
    }
  }, {
    key: "resetTracking",
    value: function resetTracking(imArr) {
      this._Module.HEAPU8.set(imArr, this.imPtr);

      var res = this._resetTracking(this.imPtr, this._width, this._height); // this._Module._free(this.imPtr);


      var resObj = this.parseResult(res);
      this.validPoints = resObj.valid;
      return resObj;
    }
  }, {
    key: "track",
    value: function track(imArr) {
      if (!this.validPoints) {
        return this.resetTracking(imArr, this._width, this._height);
      }

      this._Module.HEAPU8.set(imArr, this.imPtr);

      var res = this._track(this.imPtr, this._width, this._height); // this._Module._free(this.imPtr);


      var resObj = this.parseResult(res);
      this.validPoints = resObj.valid;
      return resObj;
    }
  }, {
    key: "transformElem",
    value: function transformElem(h, elem) {
      // column major order
      var transform = [h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, h[8]];
      transform = "matrix3d(" + transform.join(",") + ")";
      elem.style["-ms-transform"] = transform;
      elem.style["-webkit-transform"] = transform;
      elem.style["-moz-transform"] = transform;
      elem.style["-o-transform"] = transform;
      elem.style.transform = transform;
      elem.style.display = "block";
    }
  }]);

  return ImageTracker;
}();

/***/ }),

/***/ "./html/index.js":
/*!***********************!*\
  !*** ./html/index.js ***!
  \***********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _grayscale_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./grayscale.js */ "./html/grayscale.js");
/* harmony import */ var _imageTracker_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./imageTracker.js */ "./html/imageTracker.js");


var width = window.innerWidth;
var height = window.innerHeight;
var shouldTrack = false;
var arElem = null;
var refIm = null;
var frames = 0;
var stats = null;
var grayscale = null;
var tracker = null;
var overlayCanv = null;

function initStats() {
  stats = new Stats();
  stats.showPanel(0);
  document.getElementById("stats").appendChild(stats.domElement);
}

function toggleTracking() {
  shouldTrack = !shouldTrack;

  if (arElem) {
    if (shouldTrack) {
      arElem.style.display = "block";
    } else {
      clearOverlayCtx(overlayCanv.getContext("2d"));
      arElem.style.display = "none";
    }
  }
}

window.addEventListener("touchstart", toggleTracking);
window.addEventListener("mousedown", toggleTracking);

function setVideoStyle(elem) {
  elem.style.position = "absolute";
  elem.style.top = 0;
  elem.style.left = 0;
}

function setupVideo(setupCallback) {
  return new Promise(function (resolve, reject) {
    var video = document.createElement("video");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", ""); // document.body.appendChild(video);

    var canvas = document.createElement("canvas");
    canvas.style.zIndex = -1;
    setVideoStyle(canvas);
    document.body.appendChild(canvas);
    grayscale = new _grayscale_js__WEBPACK_IMPORTED_MODULE_0__["GrayScale"](video, width, height, canvas);
    grayscale.requestStream().then(function () {
      overlayCanv = document.createElement("canvas");
      setVideoStyle(overlayCanv);
      overlayCanv.id = "overlay";
      overlayCanv.width = width;
      overlayCanv.height = height;
      overlayCanv.style.zIndex = 0;
      document.body.appendChild(overlayCanv);
      resolve();
    })["catch"](function (err) {
      console.warn("ERROR: " + err);
      reject();
    });
  });
}

function clearOverlayCtx(overlayCtx) {
  if (!overlayCanv) return;
  overlayCtx.clearRect(0, 0, width, height);
}

function drawCorners(corners) {
  if (!overlayCanv) return;
  var overlayCtx = overlayCanv.getContext("2d");
  clearOverlayCtx(overlayCtx);
  overlayCtx.beginPath();
  overlayCtx.strokeStyle = "blue";
  overlayCtx.lineWidth = 5; // [x1,y1,x2,y2...]

  overlayCtx.moveTo(corners[0], corners[1]);
  overlayCtx.lineTo(corners[2], corners[3]);
  overlayCtx.lineTo(corners[4], corners[5]);
  overlayCtx.lineTo(corners[6], corners[7]);
  overlayCtx.lineTo(corners[0], corners[1]);
  overlayCtx.stroke();
}

function processVideo() {
  stats.begin();
  var frame = grayscale.getFrame();

  if (frame && shouldTrack) {
    var res;

    if (++frames % 60 == 0) {
      // reset tracking every 60 frames in case tracking gets lost
      res = tracker.resetTracking(frame, width, height);
    } else {
      res = tracker.track(frame, width, height);
    }

    if (res.valid) {
      tracker.transformElem(res.H, arElem);
      drawCorners(res.corners);
    } else {
      clearOverlayCtx(overlayCanv.getContext("2d"));
      arElem.style.display = "none";
    }
  }

  stats.end();
  requestAnimationFrame(processVideo);
}

function createRefIm() {
  refIm = document.getElementById("refIm");
  var refGrayscale = new _grayscale_js__WEBPACK_IMPORTED_MODULE_0__["GrayScale"](refIm, refIm.width, refIm.height, null);
  return refGrayscale.getFrame();
}

window.onload = function () {
  tracker = new _imageTracker_js__WEBPACK_IMPORTED_MODULE_1__["ImageTracker"](width, height, function () {
    initStats();
    setupVideo().then(function () {
      tracker.init(createRefIm(), refIm.width, refIm.height);
      arElem = document.getElementById("arElem");
      arElem.style["transform-origin"] = "top left"; // default is center

      arElem.style.zIndex = 1;
      var instructionsPopUp = document.getElementById("instructions");
      instructions.className = "show";
      setTimeout(function () {
        instructions.className = "hide";
      }, 5000);
      requestAnimationFrame(processVideo);
    });
  });
};

/***/ }),

/***/ "./html/shaders/flip-image.glsl":
/*!**************************************!*\
  !*** ./html/shaders/flip-image.glsl ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "attribute vec2 position;\nvarying vec2 tex_coords;\nvoid main(void) {\ntex_coords = (position + 1.0) / 2.0;\ntex_coords.y = 1.0 - tex_coords.y;\ngl_Position = vec4(position, 0.0, 1.0);\n}"

/***/ }),

/***/ "./html/shaders/grayscale.glsl":
/*!*************************************!*\
  !*** ./html/shaders/grayscale.glsl ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "precision highp float;\nuniform sampler2D u_image;\nvarying vec2 tex_coords;\nconst vec3 g = vec3(0.299, 0.587, 0.114);\nvoid main(void) {\nvec4 color = texture2D(u_image, tex_coords);\nfloat gray = dot(color.rgb, g);\ngl_FragColor = vec4(vec3(gray), 1.0);\n}"

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/classCallCheck.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/classCallCheck.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/createClass.js":
/*!************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/createClass.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/typeof.js":
/*!*******************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/typeof.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;

/***/ })

/******/ })["default"];
//# sourceMappingURL=wasm-ar.js.map
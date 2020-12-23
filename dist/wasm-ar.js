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
  function ImageTracker(callback) {
    _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default()(this, ImageTracker);

    var _this = this;

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
    }
  }, {
    key: "createImBuf",
    value: function createImBuf(imArr) {
      var imPtr = this._Module._malloc(imArr.length);

      this._Module.HEAPU8.set(imArr, imPtr);

      return imPtr;
    }
  }, {
    key: "init",
    value: function init(refImArr, width, height) {
      var refImPtr = this.createImBuf(refImArr);

      this._init(refImPtr, width, height);

      this._Module._free(refImPtr);
    }
  }, {
    key: "validHomography",
    value: function validHomography(h) {
      var det = h[0] * h[4] - h[1] * h[3]; // check if determinant of top left 2x2 is valid

      return 1 / N < Math.abs(det) && Math.abs(det) < N;
    }
  }, {
    key: "parseResult",
    value: function parseResult(ptr) {
      var ptrF64 = ptr / Float64Array.BYTES_PER_ELEMENT;
      var i = 0;
      var h = [];

      for (; i < 9; i++) {
        h.push(this._Module.HEAPF64[ptrF64 + i]);
      }

      var warped = [];

      for (; i < 17; i++) {
        warped.push(this._Module.HEAPF64[ptrF64 + i]);
      }

      return {
        valid: this.validHomography(h),
        H: h,
        corners: warped
      };
    }
  }, {
    key: "resetTracking",
    value: function resetTracking(imArr, width, height) {
      var imPtr = this.createImBuf(imArr);

      var res = this._resetTracking(imPtr, width, height);

      this._Module._free(imPtr);

      var resObj = this.parseResult(res);
      this.validPoints = resObj.valid;
      return resObj;
    }
  }, {
    key: "track",
    value: function track(imArr, width, height) {
      if (!this.validPoints) {
        return this.resetTracking(imArr, width, height);
      }

      var imPtr = this.createImBuf(imArr);

      var res = this._track(imPtr, width, height);

      this._Module._free(imPtr);

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
/* harmony import */ var _imageTracker_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./imageTracker.js */ "./html/imageTracker.js");

var width = window.innerWidth;
var height = window.innerHeight;
var frames = 0;

function initStats() {
  window.stats = new Stats();
  window.stats.showPanel(0);
  document.getElementById("stats").appendChild(stats.domElement);
}

function toggleTracking() {
  window.shouldTrack = !window.shouldTrack;

  if (window.arElem) {
    if (window.shouldTrack) {
      window.arElem.style.display = "block";
    } else {
      clearOverlayCtx(window.overlayCanv.getContext("2d"));
      window.arElem.style.display = "none";
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

function setupVideo(displayVid, displayOverlay, setupCallback) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn("Browser does not support getUserMedia!");
    return;
  }

  window.videoElem = document.createElement("video");
  window.videoElem.setAttribute("autoplay", "");
  window.videoElem.setAttribute("muted", "");
  window.videoElem.setAttribute("playsinline", ""); // document.body.appendChild(window.videoElem);

  var vidWidth = window.orientation ? width : height;
  var vidHeight = window.orientation ? height : width;
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: {
        ideal: vidWidth
      },
      height: {
        ideal: vidHeight
      },
      aspectRatio: {
        ideal: vidWidth / vidHeight
      },
      facingMode: "environment"
    }
  }).then(function (stream) {
    window.videoElem.srcObject = stream;

    window.videoElem.onloadedmetadata = function (e) {
      window.videoElem.play();
    };
  })["catch"](function (err) {
    console.warn("ERROR: " + err);
  });
  window.videoCanv = document.createElement("canvas");
  setVideoStyle(window.videoCanv);
  window.videoCanv.style.zIndex = -1;

  if (displayVid) {
    window.videoCanv.width = width;
    window.videoCanv.height = height;
    document.body.appendChild(window.videoCanv);
  }

  if (displayOverlay) {
    window.overlayCanv = document.createElement("canvas");
    setVideoStyle(window.overlayCanv);
    window.overlayCanv.width = width;
    window.overlayCanv.height = height;
    window.overlayCanv.style.zIndex = 0;
    document.body.appendChild(window.overlayCanv);
  }

  if (setupCallback != null) {
    setupCallback();
  }
}

function getFrame() {
  var videoCanvCtx = window.videoCanv.getContext("2d");
  videoCanvCtx.drawImage(window.videoElem, 0, 0, width, height);
  return videoCanvCtx.getImageData(0, 0, width, height).data;
}

function clearOverlayCtx(overlayCtx) {
  if (!window.overlayCanv) return;
  overlayCtx.clearRect(0, 0, width, height);
}

function drawCorners(corners) {
  if (!window.overlayCanv) return;
  var overlayCtx = window.overlayCanv.getContext("2d");
  clearOverlayCtx(overlayCtx);
  overlayCtx.beginPath();
  overlayCtx.strokeStyle = "blue";
  overlayCtx.lineWidth = 2; // [x1,y1,x2,y2...]

  overlayCtx.moveTo(corners[0], corners[1]);
  overlayCtx.lineTo(corners[2], corners[3]);
  overlayCtx.lineTo(corners[4], corners[5]);
  overlayCtx.lineTo(corners[6], corners[7]);
  overlayCtx.lineTo(corners[0], corners[1]);
  overlayCtx.stroke();
}

function processVideo() {
  window.stats.begin();
  var frame = getFrame();

  if (window.shouldTrack) {
    var res;

    if (++frames % 120 == 0) {
      // reset tracking every 120 frames in case tracking gets lost
      res = window.tracker.resetTracking(frame, width, height);
    } else {
      res = window.tracker.track(frame, width, height);
    }

    if (res.valid) {
      window.tracker.transformElem(res.H, window.arElem);
      drawCorners(res.corners);
    } else {
      clearOverlayCtx(window.overlayCanv.getContext("2d"));
      window.arElem.style.display = "none";
    }
  }

  window.stats.end();
  requestAnimationFrame(processVideo);
}

function createRefIm() {
  var refIm = document.getElementById("refIm");
  var canv = document.createElement("canvas");
  var ctx = canv.getContext("2d");
  canv.width = refIm.width;
  canv.height = refIm.height;
  ctx.drawImage(refIm, 0, 0);
  return ctx.getImageData(0, 0, refIm.width, refIm.height).data;
}

window.onload = function () {
  window.tracker = new _imageTracker_js__WEBPACK_IMPORTED_MODULE_0__["ImageTracker"](function () {
    initStats();
    setupVideo(true, true, function () {
      window.tracker.init(createRefIm(), refIm.width, refIm.height);
      window.arElem = document.getElementById("arElem");
      window.arElem.style["transform-origin"] = "top left"; // default is center

      window.arElem.style.zIndex = 1;
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

/***/ })

/******/ })["default"];
//# sourceMappingURL=wasm-ar.js.map
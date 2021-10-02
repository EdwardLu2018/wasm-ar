import {ImageTrackerModule} from "./image-tracker-module";

self.onmessage = function (e) {
    var msg = e.data;
    switch (msg.type) {
        case "init": {
            load(msg);
            return;
        }
        case "refIm": {
            addRefIm(msg);
            return;
        }
        case "process": {
            next = msg.imagedata;
            process();
            return;
        }
        default: {
            break;
        }
    }
};

var next = null;
var tracker = null;
var result = null;

function load(msg) {
    var onLoad = function() {
        postMessage({ type: "loaded" });
    }

    tracker = new ImageTrackerModule(msg.width, msg.height, onLoad);
}

function addRefIm(msg) {
    tracker.addRefIm(msg.imagedata, msg.width, msg.height)
        .then(() => {
            postMessage({ type: "refImLoaded" });
        });
}

function process() {
    result = null;

    if (tracker) {
        result = tracker.track(next);
    }

    if (result && result.valid) {
        postMessage({ type: "result", result: result });
    }
    else {
        postMessage({ type: "not found" });
    }

    next = null;
}

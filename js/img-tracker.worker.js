import {ImageTrackerModule} from "./image-tracker-module";

var next = null;
var tracker = null;
var result = null;

onmessage = (e) => {
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

function load(msg) {
    var onLoad = function() {
        postMessage({ type: "loaded" });
    }

    tracker = new ImageTrackerModule(msg.width, msg.height, onLoad);
}

function addRefIm(msg) {
    tracker.addRefIm(msg.imagedata, msg.width, msg.height)
    postMessage({ type: "refImLoaded" });
}

function process() {
    result = null;

    if (tracker) {
        result = tracker.track(next);
    }

    if (result && result.valid) {
        result.type = "result";
        postMessage(result);
    }
    else {
        postMessage({ type: "not found" });
    }

    next = null;
}

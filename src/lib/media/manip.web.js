/// <reference lib="dom" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { blobToDataUri, getDataUriSize } from './util';
export function compressIfNeeded(img, maxSize) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (img.size < maxSize) {
                        return [2 /*return*/, img];
                    }
                    return [4 /*yield*/, doResize(img.path, {
                            width: img.width,
                            height: img.height,
                            mode: 'stretch',
                            maxSize: maxSize,
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function downloadAndResize(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var controller, to, res, resBody, dataUri;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    controller = new AbortController();
                    to = setTimeout(function () { return controller.abort(); }, opts.timeout || 5e3);
                    return [4 /*yield*/, fetch(opts.uri)];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.blob()];
                case 2:
                    resBody = _a.sent();
                    clearTimeout(to);
                    return [4 /*yield*/, blobToDataUri(resBody)];
                case 3:
                    dataUri = _a.sent();
                    return [4 /*yield*/, doResize(dataUri, opts)];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function shareImageModal(_opts) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // TODO
            throw new Error('TODO');
        });
    });
}
export function saveImageToMediaLibrary(_opts) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // TODO
            throw new Error('TODO');
        });
    });
}
export function getImageDim(path) {
    return __awaiter(this, void 0, void 0, function () {
        var img, promise;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    img = document.createElement('img');
                    promise = new Promise(function (resolve, reject) {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                    img.src = path;
                    return [4 /*yield*/, promise];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { width: img.width, height: img.height }];
            }
        });
    });
}
function doResize(dataUri, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var newDataUri, minQualityPercentage, maxQualityPercentage, qualityPercentage, tempDataUri;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    minQualityPercentage = 0;
                    maxQualityPercentage = 101 //exclusive
                    ;
                    _a.label = 1;
                case 1:
                    if (!(maxQualityPercentage - minQualityPercentage > 1)) return [3 /*break*/, 3];
                    qualityPercentage = Math.round((maxQualityPercentage + minQualityPercentage) / 2);
                    return [4 /*yield*/, createResizedImage(dataUri, {
                            width: opts.width,
                            height: opts.height,
                            quality: qualityPercentage / 100,
                            mode: opts.mode,
                        })];
                case 2:
                    tempDataUri = _a.sent();
                    if (getDataUriSize(tempDataUri) < opts.maxSize) {
                        minQualityPercentage = qualityPercentage;
                        newDataUri = tempDataUri;
                    }
                    else {
                        maxQualityPercentage = qualityPercentage;
                    }
                    return [3 /*break*/, 1];
                case 3:
                    if (!newDataUri) {
                        throw new Error('Failed to compress image');
                    }
                    return [2 /*return*/, {
                            path: newDataUri,
                            mime: 'image/jpeg',
                            size: getDataUriSize(newDataUri),
                            width: opts.width,
                            height: opts.height,
                        }];
            }
        });
    });
}
function createResizedImage(dataUri, _a) {
    var width = _a.width, height = _a.height, quality = _a.quality, mode = _a.mode;
    return new Promise(function (resolve, reject) {
        var img = document.createElement('img');
        img.addEventListener('load', function () {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Failed to resize image'));
            }
            var scale = 1;
            if (mode === 'cover') {
                scale = img.width < img.height ? width / img.width : height / img.height;
            }
            else if (mode === 'contain') {
                scale = img.width > img.height ? width / img.width : height / img.height;
            }
            var w = img.width * scale;
            var h = img.height * scale;
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
        });
        img.addEventListener('error', function (ev) {
            reject(ev.error);
        });
        img.src = dataUri;
    });
}
export function saveBytesToDisk(filename, bytes, type) {
    return __awaiter(this, void 0, void 0, function () {
        var blob, url;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    blob = new Blob([bytes], { type: type });
                    url = URL.createObjectURL(blob);
                    return [4 /*yield*/, downloadUrl(url, filename)
                        // Firefox requires a small delay
                    ];
                case 1:
                    _a.sent();
                    // Firefox requires a small delay
                    setTimeout(function () { return URL.revokeObjectURL(url); }, 100);
                    return [2 /*return*/, true];
            }
        });
    });
}
function downloadUrl(href, filename) {
    return __awaiter(this, void 0, void 0, function () {
        var a;
        return __generator(this, function (_a) {
            a = document.createElement('a');
            a.href = href;
            a.download = filename;
            a.click();
            return [2 /*return*/];
        });
    });
}
export function safeDeleteAsync() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    });
}

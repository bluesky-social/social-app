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
import { cacheDirectory, copyAsync, deleteAsync, makeDirectoryAsync, moveAsync, } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat, } from 'expo-image-manipulator';
import { nanoid } from 'nanoid/non-secure';
import { POST_IMG_MAX } from '#/lib/constants';
import { getImageDim } from '#/lib/media/manip';
import { openCropper } from '#/lib/media/picker';
import { getDataUriSize } from '#/lib/media/util';
import { isCancelledError } from '#/lib/strings/errors';
import { IS_NATIVE, IS_WEB } from '#/env';
var _imageCacheDirectory;
function getImageCacheDirectory() {
    if (IS_NATIVE) {
        return (_imageCacheDirectory !== null && _imageCacheDirectory !== void 0 ? _imageCacheDirectory : (_imageCacheDirectory = joinPath(cacheDirectory, 'bsky-composer')));
    }
    return null;
}
export function createComposerImage(raw) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = {
                        alt: ''
                    };
                    _b = {
                        id: nanoid()
                    };
                    return [4 /*yield*/, copyToCache(raw.path)];
                case 1: return [2 /*return*/, (_a.source = (
                    // Copy to cache to ensure file survives OS temporary file cleanup
                    _b.path = _c.sent(),
                        _b.width = raw.width,
                        _b.height = raw.height,
                        _b.mime = raw.mime,
                        _b),
                        _a)];
            }
        });
    });
}
export function createInitialImages(uris) {
    if (uris === void 0) { uris = []; }
    return uris.map(function (_a) {
        var uri = _a.uri, width = _a.width, height = _a.height, _b = _a.altText, altText = _b === void 0 ? '' : _b;
        return {
            alt: altText,
            source: {
                id: nanoid(),
                path: uri,
                width: width,
                height: height,
                mime: 'image/jpeg',
            },
        };
    });
}
export function pasteImage(uri) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, width, height, match;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getImageDim(uri)];
                case 1:
                    _a = _b.sent(), width = _a.width, height = _a.height;
                    match = /^data:(.+?);/.exec(uri);
                    return [2 /*return*/, {
                            alt: '',
                            source: {
                                id: nanoid(),
                                path: uri,
                                width: width,
                                height: height,
                                mime: match ? match[1] : 'image/jpeg',
                            },
                        }];
            }
        });
    });
}
export function cropImage(img) {
    return __awaiter(this, void 0, void 0, function () {
        var source, cropped, e_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!IS_NATIVE) {
                        return [2 /*return*/, img];
                    }
                    source = img.source;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, openCropper({
                            imageUri: source.path,
                        })];
                case 2:
                    cropped = _c.sent();
                    _a = {
                        alt: img.alt,
                        source: source
                    };
                    _b = {};
                    return [4 /*yield*/, moveIfNecessary(cropped.path)];
                case 3: return [2 /*return*/, (_a.transformed = (_b.path = _c.sent(),
                        _b.width = cropped.width,
                        _b.height = cropped.height,
                        _b.mime = cropped.mime,
                        _b),
                        _a)];
                case 4:
                    e_1 = _c.sent();
                    if (!isCancelledError(e_1)) {
                        return [2 /*return*/, img];
                    }
                    throw e_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function manipulateImage(img, trans) {
    return __awaiter(this, void 0, void 0, function () {
        var rawActions, actions, source, result;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    rawActions = [trans.crop && { crop: trans.crop }];
                    actions = rawActions.filter(function (a) { return a !== undefined; });
                    if (actions.length === 0) {
                        if (img.transformed === undefined) {
                            return [2 /*return*/, img];
                        }
                        return [2 /*return*/, { alt: img.alt, source: img.source }];
                    }
                    source = img.source;
                    return [4 /*yield*/, manipulateAsync(source.path, actions, {
                            format: SaveFormat.PNG,
                        })];
                case 1:
                    result = _c.sent();
                    _a = {
                        alt: img.alt,
                        source: img.source
                    };
                    _b = {};
                    return [4 /*yield*/, moveIfNecessary(result.uri)];
                case 2: return [2 /*return*/, (_a.transformed = (_b.path = _c.sent(),
                        _b.width = result.width,
                        _b.height = result.height,
                        _b.mime = 'image/png',
                        _b),
                        _a.manips = trans,
                        _a)];
            }
        });
    });
}
export function resetImageManipulation(img) {
    if (img.transformed !== undefined) {
        return { alt: img.alt, source: img.source };
    }
    return img;
}
export function compressImage(img) {
    return __awaiter(this, void 0, void 0, function () {
        var source, _a, w, h, minQualityPercentage, maxQualityPercentage, newDataUri, qualityPercentage, res, base64, size;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    source = img.transformed || img.source;
                    _a = containImageRes(source.width, source.height, POST_IMG_MAX), w = _a[0], h = _a[1];
                    minQualityPercentage = 0;
                    maxQualityPercentage = 101 // exclusive
                    ;
                    _c.label = 1;
                case 1:
                    if (!(maxQualityPercentage - minQualityPercentage > 1)) return [3 /*break*/, 6];
                    qualityPercentage = Math.round((maxQualityPercentage + minQualityPercentage) / 2);
                    return [4 /*yield*/, manipulateAsync(source.path, [{ resize: { width: w, height: h } }], {
                            compress: qualityPercentage / 100,
                            format: SaveFormat.JPEG,
                            base64: true,
                        })];
                case 2:
                    res = _c.sent();
                    base64 = res.base64;
                    size = base64 ? getDataUriSize(base64) : 0;
                    if (!(base64 && size <= POST_IMG_MAX.size)) return [3 /*break*/, 4];
                    minQualityPercentage = qualityPercentage;
                    _b = {};
                    return [4 /*yield*/, moveIfNecessary(res.uri)];
                case 3:
                    newDataUri = (_b.path = _c.sent(),
                        _b.width = res.width,
                        _b.height = res.height,
                        _b.mime = 'image/jpeg',
                        _b.size = size,
                        _b);
                    return [3 /*break*/, 5];
                case 4:
                    maxQualityPercentage = qualityPercentage;
                    _c.label = 5;
                case 5: return [3 /*break*/, 1];
                case 6:
                    if (newDataUri) {
                        return [2 /*return*/, newDataUri];
                    }
                    throw new Error("Unable to compress image");
            }
        });
    });
}
function moveIfNecessary(from) {
    return __awaiter(this, void 0, void 0, function () {
        var cacheDir, to;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cacheDir = IS_NATIVE && getImageCacheDirectory();
                    if (!(cacheDir && from.startsWith(cacheDir))) return [3 /*break*/, 3];
                    to = joinPath(cacheDir, nanoid(36));
                    return [4 /*yield*/, makeDirectoryAsync(cacheDir, { intermediates: true })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, moveAsync({ from: from, to: to })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, to];
                case 3: return [2 /*return*/, from];
            }
        });
    });
}
/**
 * Copy a file from a potentially temporary location to our cache directory.
 * This ensures picker files are available for draft saving even if the original
 * temporary files are cleaned up by the OS.
 *
 * On web, converts blob URLs to data URIs immediately to prevent revocation issues.
 */
function copyToCache(from) {
    return __awaiter(this, void 0, void 0, function () {
        var response, blob, e_2, cacheDir, to, normalizedFrom;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Data URIs don't need any conversion
                    if (from.startsWith('data:')) {
                        return [2 /*return*/, from];
                    }
                    if (!IS_WEB) return [3 /*break*/, 7];
                    if (!from.startsWith('blob:')) return [3 /*break*/, 6];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch(from)];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.blob()];
                case 3:
                    blob = _a.sent();
                    return [4 /*yield*/, blobToDataUri(blob)];
                case 4: return [2 /*return*/, _a.sent()];
                case 5:
                    e_2 = _a.sent();
                    // Blob URL was likely revoked, return as-is for downstream error handling
                    return [2 /*return*/, from];
                case 6: 
                // Other URLs on web don't need conversion
                return [2 /*return*/, from];
                case 7:
                    cacheDir = getImageCacheDirectory();
                    if (!cacheDir || from.startsWith(cacheDir)) {
                        return [2 /*return*/, from];
                    }
                    to = joinPath(cacheDir, nanoid(36));
                    return [4 /*yield*/, makeDirectoryAsync(cacheDir, { intermediates: true })];
                case 8:
                    _a.sent();
                    normalizedFrom = from;
                    if (!from.startsWith('file://') && from.startsWith('/')) {
                        normalizedFrom = "file://".concat(from);
                    }
                    return [4 /*yield*/, copyAsync({ from: normalizedFrom, to: to })];
                case 9:
                    _a.sent();
                    return [2 /*return*/, to];
            }
        });
    });
}
/**
 * Convert a Blob to a data URI
 */
function blobToDataUri(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function () {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            }
            else {
                reject(new Error('Failed to convert blob to data URI'));
            }
        };
        reader.onerror = function () { return reject(reader.error); };
        reader.readAsDataURL(blob);
    });
}
/** Purge files that were created to accomodate image manipulation */
export function purgeTemporaryImageFiles() {
    return __awaiter(this, void 0, void 0, function () {
        var cacheDir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cacheDir = IS_NATIVE && getImageCacheDirectory();
                    if (!cacheDir) return [3 /*break*/, 3];
                    return [4 /*yield*/, deleteAsync(cacheDir, { idempotent: true })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, makeDirectoryAsync(cacheDir)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function joinPath(a, b) {
    if (a.endsWith('/')) {
        if (b.startsWith('/')) {
            return a.slice(0, -1) + b;
        }
        return a + b;
    }
    else if (b.startsWith('/')) {
        return a + b;
    }
    return a + '/' + b;
}
function containImageRes(w, h, _a) {
    var maxW = _a.width, maxH = _a.height;
    var scale = 1;
    if (w > maxW || h > maxH) {
        scale = w > h ? maxW / w : maxH / h;
        w = Math.floor(w * scale);
        h = Math.floor(h * scale);
    }
    return [w, h];
}

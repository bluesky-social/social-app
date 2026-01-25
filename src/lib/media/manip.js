var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { Image as RNImage } from 'react-native';
import uuid from 'react-native-uuid';
import { cacheDirectory, copyAsync, createDownloadResumable, deleteAsync, EncodingType, getInfoAsync, makeDirectoryAsync, StorageAccessFramework, writeAsStringAsync, } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';
import { POST_IMG_MAX } from '#/lib/constants';
import { logger } from '#/logger';
import { IS_ANDROID, IS_IOS } from '#/env';
export function compressIfNeeded(img_1) {
    return __awaiter(this, arguments, void 0, function (img, maxSize) {
        var resizedImage, finalImageMovedPath, finalImg;
        if (maxSize === void 0) { maxSize = POST_IMG_MAX.size; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (img.size < maxSize) {
                        return [2 /*return*/, img];
                    }
                    return [4 /*yield*/, doResize(normalizePath(img.path), {
                            width: img.width,
                            height: img.height,
                            mode: 'stretch',
                            maxSize: maxSize,
                        })];
                case 1:
                    resizedImage = _a.sent();
                    return [4 /*yield*/, moveToPermanentPath(resizedImage.path, '.jpg')];
                case 2:
                    finalImageMovedPath = _a.sent();
                    finalImg = __assign(__assign({}, resizedImage), { path: finalImageMovedPath });
                    return [2 /*return*/, finalImg];
            }
        });
    });
}
export function downloadAndResize(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var appendExt, urip, ext, path;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    appendExt = 'jpeg';
                    try {
                        urip = new URL(opts.uri);
                        ext = urip.pathname.split('.').pop();
                        if (ext === 'png') {
                            appendExt = 'png';
                        }
                    }
                    catch (e) {
                        console.error('Invalid URI', opts.uri, e);
                        return [2 /*return*/];
                    }
                    path = createPath(appendExt);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 4, 5]);
                    return [4 /*yield*/, downloadImage(opts.uri, path, opts.timeout)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, doResize(path, opts)];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    safeDeleteAsync(path);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function shareImageModal(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var imageUri, imagePath;
        var uri = _b.uri;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, Sharing.isAvailableAsync()];
                case 1:
                    if (!(_c.sent())) {
                        // TODO might need to give an error to the user in this case -prf
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, downloadImage(uri, createPath('jpg'), 15e3)];
                case 2:
                    imageUri = _c.sent();
                    return [4 /*yield*/, moveToPermanentPath(imageUri, '.jpg')];
                case 3:
                    imagePath = _c.sent();
                    safeDeleteAsync(imageUri);
                    return [4 /*yield*/, Sharing.shareAsync(imagePath, {
                            mimeType: 'image/jpeg',
                            UTI: 'image/jpeg',
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var ALBUM_NAME = 'Bluesky';
export function saveImageToMediaLibrary(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var imageUri, imagePath, album, err_1, err_2, err2_1, err_3;
        var uri = _b.uri;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, downloadImage(uri, createPath('jpg'), 15e3)];
                case 1:
                    imageUri = _c.sent();
                    return [4 /*yield*/, moveToPermanentPath(imageUri, '.jpg')
                        // save
                    ];
                case 2:
                    imagePath = _c.sent();
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 25, 26, 27]);
                    if (!IS_ANDROID) return [3 /*break*/, 22];
                    return [4 /*yield*/, MediaLibrary.getAlbumAsync(ALBUM_NAME)];
                case 4:
                    album = _c.sent();
                    if (!album) return [3 /*break*/, 19];
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 9, , 10]);
                    return [4 /*yield*/, MediaLibrary.albumNeedsMigrationAsync(album)];
                case 6:
                    if (!_c.sent()) return [3 /*break*/, 8];
                    return [4 /*yield*/, MediaLibrary.migrateAlbumIfNeededAsync(album)];
                case 7:
                    _c.sent();
                    _c.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    err_1 = _c.sent();
                    logger.info('Attempted and failed to migrate album', {
                        safeMessage: err_1,
                    });
                    return [3 /*break*/, 10];
                case 10:
                    _c.trys.push([10, 12, , 18]);
                    // if album exists, put the image straight in there
                    return [4 /*yield*/, MediaLibrary.createAssetAsync(imagePath, album)];
                case 11:
                    // if album exists, put the image straight in there
                    _c.sent();
                    return [3 /*break*/, 18];
                case 12:
                    err_2 = _c.sent();
                    logger.info('Failed to create asset', { safeMessage: err_2 });
                    _c.label = 13;
                case 13:
                    _c.trys.push([13, 15, , 17]);
                    return [4 /*yield*/, MediaLibrary.createAlbumAsync(ALBUM_NAME, undefined, undefined, imagePath)];
                case 14:
                    _c.sent();
                    return [3 /*break*/, 17];
                case 15:
                    err2_1 = _c.sent();
                    logger.info('Failed to create asset in a fresh album', {
                        safeMessage: err2_1,
                    });
                    // ... and if all else fails, just put it in DCIM
                    return [4 /*yield*/, MediaLibrary.createAssetAsync(imagePath)];
                case 16:
                    // ... and if all else fails, just put it in DCIM
                    _c.sent();
                    return [3 /*break*/, 17];
                case 17: return [3 /*break*/, 18];
                case 18: return [3 /*break*/, 21];
                case 19: 
                // otherwise, create album with asset (albums must always have at least one asset)
                return [4 /*yield*/, MediaLibrary.createAlbumAsync(ALBUM_NAME, undefined, undefined, imagePath)];
                case 20:
                    // otherwise, create album with asset (albums must always have at least one asset)
                    _c.sent();
                    _c.label = 21;
                case 21: return [3 /*break*/, 24];
                case 22: return [4 /*yield*/, MediaLibrary.saveToLibraryAsync(imagePath)];
                case 23:
                    _c.sent();
                    _c.label = 24;
                case 24: return [3 /*break*/, 27];
                case 25:
                    err_3 = _c.sent();
                    logger.error(err_3 instanceof Error ? err_3 : String(err_3), {
                        message: 'Failed to save image to media library',
                    });
                    throw err_3;
                case 26:
                    safeDeleteAsync(imagePath);
                    return [7 /*endfinally*/];
                case 27: return [2 /*return*/];
            }
        });
    });
}
export function getImageDim(path) {
    return new Promise(function (resolve, reject) {
        RNImage.getSize(path, function (width, height) {
            resolve({ width: width, height: height });
        }, reject);
    });
}
function doResize(localUri, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var imageRes, newDimensions, minQualityPercentage, maxQualityPercentage, newDataUri, intermediateUris, qualityPercentage, resizeRes, fileInfo, _i, intermediateUris_1, intermediateUri;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, manipulateAsync(localUri, [], {})];
                case 1:
                    imageRes = _a.sent();
                    newDimensions = getResizedDimensions({
                        width: imageRes.width,
                        height: imageRes.height,
                    });
                    minQualityPercentage = 0;
                    maxQualityPercentage = 101 // exclusive
                    ;
                    intermediateUris = [];
                    _a.label = 2;
                case 2:
                    if (!(maxQualityPercentage - minQualityPercentage > 1)) return [3 /*break*/, 5];
                    qualityPercentage = Math.round((maxQualityPercentage + minQualityPercentage) / 2);
                    return [4 /*yield*/, manipulateAsync(localUri, [{ resize: newDimensions }], {
                            format: SaveFormat.JPEG,
                            compress: qualityPercentage / 100,
                        })];
                case 3:
                    resizeRes = _a.sent();
                    intermediateUris.push(resizeRes.uri);
                    return [4 /*yield*/, getInfoAsync(resizeRes.uri)];
                case 4:
                    fileInfo = _a.sent();
                    if (!fileInfo.exists) {
                        throw new Error('The image manipulation library failed to create a new image.');
                    }
                    if (fileInfo.size < opts.maxSize) {
                        minQualityPercentage = qualityPercentage;
                        newDataUri = {
                            path: normalizePath(resizeRes.uri),
                            mime: 'image/jpeg',
                            size: fileInfo.size,
                            width: resizeRes.width,
                            height: resizeRes.height,
                        };
                    }
                    else {
                        maxQualityPercentage = qualityPercentage;
                    }
                    return [3 /*break*/, 2];
                case 5:
                    for (_i = 0, intermediateUris_1 = intermediateUris; _i < intermediateUris_1.length; _i++) {
                        intermediateUri = intermediateUris_1[_i];
                        if ((newDataUri === null || newDataUri === void 0 ? void 0 : newDataUri.path) !== normalizePath(intermediateUri)) {
                            safeDeleteAsync(intermediateUri);
                        }
                    }
                    if (newDataUri) {
                        safeDeleteAsync(imageRes.uri);
                        return [2 /*return*/, newDataUri];
                    }
                    throw new Error("This image is too big! We couldn't compress it down to ".concat(opts.maxSize, " bytes"));
            }
        });
    });
}
function moveToPermanentPath(path, ext) {
    return __awaiter(this, void 0, void 0, function () {
        var filename, destinationPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filename = uuid.v4();
                    destinationPath = joinPath(cacheDirectory, filename + ext);
                    return [4 /*yield*/, copyAsync({
                            from: normalizePath(path),
                            to: normalizePath(destinationPath),
                        })];
                case 1:
                    _a.sent();
                    safeDeleteAsync(path);
                    return [2 /*return*/, normalizePath(destinationPath)];
            }
        });
    });
}
export function safeDeleteAsync(path) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedPath, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    normalizedPath = normalizePath(path);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, deleteAsync(normalizedPath, { idempotent: true })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    console.error('Failed to delete file', e_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
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
function normalizePath(str, allPlatforms) {
    if (allPlatforms === void 0) { allPlatforms = false; }
    if (IS_ANDROID || allPlatforms) {
        if (!str.startsWith('file://')) {
            return "file://".concat(str);
        }
    }
    return str;
}
export function saveBytesToDisk(filename, bytes, type) {
    return __awaiter(this, void 0, void 0, function () {
        var encoded;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    encoded = Buffer.from(bytes).toString('base64');
                    return [4 /*yield*/, saveToDevice(filename, encoded, type)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function saveToDevice(filename, encoded, type) {
    return __awaiter(this, void 0, void 0, function () {
        var permissions, fileUrl, e_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    if (!IS_IOS) return [3 /*break*/, 2];
                    return [4 /*yield*/, withTempFile(filename, encoded, function (tmpFileUrl) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Sharing.shareAsync(tmpFileUrl, { UTI: type })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2: return [4 /*yield*/, StorageAccessFramework.requestDirectoryPermissionsAsync()];
                case 3:
                    permissions = _a.sent();
                    if (!permissions.granted) {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, type)];
                case 4:
                    fileUrl = _a.sent();
                    return [4 /*yield*/, writeAsStringAsync(fileUrl, encoded, {
                            encoding: EncodingType.Base64,
                        })];
                case 5:
                    _a.sent();
                    return [2 /*return*/, true];
                case 6: return [3 /*break*/, 8];
                case 7:
                    e_2 = _a.sent();
                    logger.error('Error occurred while saving file', { message: e_2 });
                    return [2 /*return*/, false];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function withTempFile(filename, encoded, cb) {
    return __awaiter(this, void 0, void 0, function () {
        var tmpDirUri, tmpFileUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tmpDirUri = joinPath(cacheDirectory, String(uuid.v4()));
                    return [4 /*yield*/, makeDirectoryAsync(tmpDirUri, { intermediates: true })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 5, 6]);
                    tmpFileUrl = joinPath(tmpDirUri, filename);
                    return [4 /*yield*/, writeAsStringAsync(tmpFileUrl, encoded, {
                            encoding: EncodingType.Base64,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, cb(tmpFileUrl)];
                case 4: return [2 /*return*/, _a.sent()];
                case 5:
                    safeDeleteAsync(tmpDirUri);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
export function getResizedDimensions(originalDims) {
    if (originalDims.width <= POST_IMG_MAX.width &&
        originalDims.height <= POST_IMG_MAX.height) {
        return originalDims;
    }
    var ratio = Math.min(POST_IMG_MAX.width / originalDims.width, POST_IMG_MAX.height / originalDims.height);
    return {
        width: Math.round(originalDims.width * ratio),
        height: Math.round(originalDims.height * ratio),
    };
}
function createPath(ext) {
    // cacheDirectory will never be null on native, so the null check here is not necessary except for typescript.
    // we use a web-only function for downloadAndResize on web
    return "".concat(cacheDirectory !== null && cacheDirectory !== void 0 ? cacheDirectory : '', "/").concat(uuid.v4(), ".").concat(ext);
}
function downloadImage(uri, path, timeout) {
    return __awaiter(this, void 0, void 0, function () {
        var dlResumable, timedOut, to1, dlRes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dlResumable = createDownloadResumable(uri, path, { cache: true });
                    timedOut = false;
                    to1 = setTimeout(function () {
                        timedOut = true;
                        dlResumable.cancelAsync();
                    }, timeout);
                    return [4 /*yield*/, dlResumable.downloadAsync()];
                case 1:
                    dlRes = _a.sent();
                    clearTimeout(to1);
                    if (!(dlRes === null || dlRes === void 0 ? void 0 : dlRes.uri)) {
                        if (timedOut) {
                            throw new Error('Failed to download image - timed out');
                        }
                        else {
                            throw new Error('Failed to download image - dlRes is undefined');
                        }
                    }
                    return [2 /*return*/, normalizePath(dlRes.uri)];
            }
        });
    });
}

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
/**
 * Web IndexedDB storage for draft media.
 * Media is stored by localRefPath key (unique identifier stored in server draft).
 */
import { createStore, del, get, keys, set } from 'idb-keyval';
import { logger } from './logger';
var DB_NAME = 'bsky-draft-media';
var STORE_NAME = 'media';
var store = createStore(DB_NAME, STORE_NAME);
/**
 * Convert a path/URL to a Blob
 */
function toBlob(sourcePath) {
    return __awaiter(this, void 0, void 0, function () {
        var response_1, response_2, e_1, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!sourcePath.startsWith('data:')) return [3 /*break*/, 2];
                    return [4 /*yield*/, fetch(sourcePath)];
                case 1:
                    response_1 = _a.sent();
                    return [2 /*return*/, response_1.blob()];
                case 2:
                    if (!sourcePath.startsWith('blob:')) return [3 /*break*/, 6];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, fetch(sourcePath)];
                case 4:
                    response_2 = _a.sent();
                    return [2 /*return*/, response_2.blob()];
                case 5:
                    e_1 = _a.sent();
                    logger.error('Failed to fetch blob URL - it may have been revoked', {
                        error: e_1,
                        sourcePath: sourcePath,
                    });
                    throw e_1;
                case 6: return [4 /*yield*/, fetch(sourcePath)];
                case 7:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch media: ".concat(response.status));
                    }
                    return [2 /*return*/, response.blob()];
            }
        });
    });
}
/**
 * Save a media file to IndexedDB by localRefPath key
 */
export function saveMediaToLocal(localRefPath, sourcePath) {
    return __awaiter(this, void 0, void 0, function () {
        var blob, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, toBlob(sourcePath)];
                case 1:
                    blob = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    logger.error('Failed to convert source to blob', {
                        error: error_1,
                        localRefPath: localRefPath,
                        sourcePath: sourcePath,
                    });
                    throw error_1;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, set(localRefPath, {
                            blob: blob,
                            createdAt: new Date().toISOString(),
                        }, store)
                        // Update cache
                    ];
                case 4:
                    _a.sent();
                    // Update cache
                    mediaExistsCache.set(localRefPath, true);
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    logger.error('Failed to save media to IndexedDB', { error: error_2, localRefPath: localRefPath });
                    throw error_2;
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Track blob URLs created by loadMediaFromLocal for cleanup
 */
var createdBlobUrls = new Set();
/**
 * Load a media file from IndexedDB
 * @returns A blob URL for the saved media
 */
export function loadMediaFromLocal(localRefPath) {
    return __awaiter(this, void 0, void 0, function () {
        var record, url;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, get(localRefPath, store)];
                case 1:
                    record = _a.sent();
                    if (!record) {
                        throw new Error("Media file not found: ".concat(localRefPath));
                    }
                    url = URL.createObjectURL(record.blob);
                    logger.debug('Created blob URL', { url: url });
                    createdBlobUrls.add(url);
                    return [2 /*return*/, url];
            }
        });
    });
}
/**
 * Delete a media file from IndexedDB
 */
export function deleteMediaFromLocal(localRefPath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, del(localRefPath, store)];
                case 1:
                    _a.sent();
                    mediaExistsCache.delete(localRefPath);
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if a media file exists in IndexedDB (synchronous check using cache)
 */
var mediaExistsCache = new Map();
var cachePopulated = false;
var populateCachePromise = null;
export function mediaExists(localRefPath) {
    if (mediaExistsCache.has(localRefPath)) {
        return mediaExistsCache.get(localRefPath);
    }
    // If cache not populated yet, trigger async population
    if (!cachePopulated && !populateCachePromise) {
        populateCachePromise = populateCacheInternal();
    }
    return false; // Conservative: assume doesn't exist if not in cache
}
function populateCacheInternal() {
    return __awaiter(this, void 0, void 0, function () {
        var allKeys, _i, allKeys_1, key, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, keys(store)];
                case 1:
                    allKeys = _a.sent();
                    for (_i = 0, allKeys_1 = allKeys; _i < allKeys_1.length; _i++) {
                        key = allKeys_1[_i];
                        mediaExistsCache.set(key, true);
                    }
                    cachePopulated = true;
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    logger.warn('Failed to populate media cache', { error: e_2 });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Ensure the media cache is populated. Call this before checking mediaExists.
 */
export function ensureMediaCachePopulated() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (cachePopulated)
                        return [2 /*return*/];
                    if (!populateCachePromise) {
                        populateCachePromise = populateCacheInternal();
                    }
                    return [4 /*yield*/, populateCachePromise];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Clear the media exists cache (call when media is added/deleted)
 */
export function clearMediaCache() {
    mediaExistsCache.clear();
    cachePopulated = false;
    populateCachePromise = null;
}
/**
 * Revoke a blob URL when done with it (to prevent memory leaks)
 */
export function revokeMediaUrl(url) {
    if (url.startsWith('blob:')) {
        logger.debug('Revoking blob URL', { url: url });
        URL.revokeObjectURL(url);
        createdBlobUrls.delete(url);
    }
}
/**
 * Revoke all blob URLs created by loadMediaFromLocal.
 * Call this when closing the drafts list dialog to prevent memory leaks.
 */
export function revokeAllMediaUrls() {
    logger.debug("Revoking ".concat(createdBlobUrls.size, " blob URLs"));
    for (var _i = 0, createdBlobUrls_1 = createdBlobUrls; _i < createdBlobUrls_1.length; _i++) {
        var url = createdBlobUrls_1[_i];
        URL.revokeObjectURL(url);
    }
    createdBlobUrls.clear();
}

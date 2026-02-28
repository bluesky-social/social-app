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
 * Native file system storage for draft media.
 * Media is stored by localRefPath key (unique identifier stored in server draft).
 */
import { Directory, File, Paths } from 'expo-file-system';
import { logger } from './logger';
var MEDIA_DIR = 'bsky-draft-media';
function getMediaDirectory() {
    return new Directory(Paths.document, MEDIA_DIR);
}
function getMediaFile(localRefPath) {
    var safeFilename = encodeURIComponent(localRefPath);
    return new File(getMediaDirectory(), safeFilename);
}
var dirCreated = false;
/**
 * Ensure the media directory exists
 */
function ensureDirectory() {
    if (dirCreated)
        return;
    var dir = getMediaDirectory();
    if (!dir.exists) {
        dir.create();
    }
    dirCreated = true;
}
/**
 * Save a media file to local storage by localRefPath key
 */
export function saveMediaToLocal(localRefPath, sourcePath) {
    return __awaiter(this, void 0, void 0, function () {
        var destFile, normalizedSource, sourceFile;
        return __generator(this, function (_a) {
            ensureDirectory();
            destFile = getMediaFile(localRefPath);
            normalizedSource = sourcePath;
            if (!sourcePath.startsWith('file://') && sourcePath.startsWith('/')) {
                normalizedSource = "file://".concat(sourcePath);
            }
            try {
                sourceFile = new File(normalizedSource);
                sourceFile.copy(destFile);
                // Update cache after successful save
                mediaExistsCache.set(localRefPath, true);
            }
            catch (error) {
                logger.error('Failed to save media to drafts storage', {
                    error: error,
                    localRefPath: localRefPath,
                    sourcePath: normalizedSource,
                    destPath: destFile.uri,
                });
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Load a media file path from local storage
 * @returns The file URI for the saved media
 */
export function loadMediaFromLocal(localRefPath) {
    return __awaiter(this, void 0, void 0, function () {
        var file;
        return __generator(this, function (_a) {
            file = getMediaFile(localRefPath);
            if (!file.exists) {
                throw new Error("Media file not found: ".concat(localRefPath));
            }
            return [2 /*return*/, file.uri];
        });
    });
}
/**
 * Delete a media file from local storage
 */
export function deleteMediaFromLocal(localRefPath) {
    return __awaiter(this, void 0, void 0, function () {
        var file;
        return __generator(this, function (_a) {
            file = getMediaFile(localRefPath);
            // Idempotent: only delete if file exists
            if (file.exists) {
                file.delete();
            }
            mediaExistsCache.delete(localRefPath);
            return [2 /*return*/];
        });
    });
}
/**
 * Check if a media file exists in local storage (synchronous check using cache)
 * Note: This uses a cached directory listing for performance
 */
var mediaExistsCache = new Map();
var cachePopulated = false;
export function mediaExists(localRefPath) {
    // For native, we need an async check but the API requires sync
    // Use cached result if available, otherwise assume doesn't exist
    if (mediaExistsCache.has(localRefPath)) {
        return mediaExistsCache.get(localRefPath);
    }
    // If cache not populated yet, trigger async population
    if (!cachePopulated && !populateCachePromise) {
        populateCachePromise = populateCacheInternal();
    }
    return false; // Conservative: assume doesn't exist if not in cache
}
var populateCachePromise = null;
function populateCacheInternal() {
    return new Promise(function (resolve) {
        try {
            var dir = getMediaDirectory();
            if (dir.exists) {
                var items = dir.list();
                for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                    var item = items_1[_i];
                    // Reverse the URL encoding to get the original localRefPath
                    var localRefPath = decodeURIComponent(item.name);
                    mediaExistsCache.set(localRefPath, true);
                }
            }
            cachePopulated = true;
        }
        catch (e) {
            logger.warn('Failed to populate media cache', { error: e });
        }
        resolve();
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
 * Revoke a media URL (no-op on native - only needed for web blob URLs)
 */
export function revokeMediaUrl(_url) {
    // No-op on native - file URIs don't need revocation
}
/**
 * Revoke all media URLs (no-op on native - only needed for web blob URLs)
 */
export function revokeAllMediaUrls() {
    // No-op on native - file URIs don't need revocation
}

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
 * Type converters for Draft API - convert between ComposerState and server Draft types.
 */
import { AtUri, RichText } from '@atproto/api';
import { nanoid } from 'nanoid/non-secure';
import { resolveLink } from '#/lib/api/resolve';
import { getDeviceName } from '#/lib/deviceName';
import { getImageDim } from '#/lib/media/manip';
import { mimeToExt } from '#/lib/media/video/util';
import { threadgateAllowUISettingToAllowRecordValue } from '#/state/queries/threadgate/util';
import { createPublicAgent } from '#/state/session/agent';
import { getDeviceId } from '#/analytics/identifiers';
import { logger } from './logger';
import * as storage from './storage';
var TENOR_HOSTNAME = 'media.tenor.com';
/**
 * Parse mime type from video localRefPath.
 * Format: `video:${mimeType}:${nanoid()}` (new) or `video:${nanoid()}` (legacy)
 */
function parseVideoMimeType(localRefPath) {
    var parts = localRefPath.split(':');
    // New format: video:video/mp4:abc123 -> parts[1] is mime type
    // Legacy format: video:abc123 -> no mime type, default to video/mp4
    if (parts.length >= 3 && parts[1].includes('/')) {
        return parts[1];
    }
    return 'video/mp4'; // Default for legacy drafts
}
/**
 * Convert ComposerState to server Draft format for saving.
 * Returns both the draft and a map of localRef paths to their source paths.
 */
export function composerStateToDraft(state) {
    return __awaiter(this, void 0, void 0, function () {
        var localRefPaths, posts, draft;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    localRefPaths = new Map();
                    return [4 /*yield*/, Promise.all(state.thread.posts.map(function (post) {
                            return postDraftToServerPost(post, localRefPaths);
                        }))];
                case 1:
                    posts = _a.sent();
                    draft = {
                        $type: 'app.bsky.draft.defs#draft',
                        deviceId: getDeviceId(),
                        deviceName: getDeviceName().slice(0, 100), // max length of 100 in lex
                        posts: posts,
                        threadgateAllow: threadgateAllowUISettingToAllowRecordValue(state.thread.threadgate),
                        postgateEmbeddingRules: state.thread.postgate.embeddingRules &&
                            state.thread.postgate.embeddingRules.length > 0
                            ? state.thread.postgate.embeddingRules
                            : undefined,
                    };
                    return [2 /*return*/, { draft: draft, localRefPaths: localRefPaths }];
            }
        });
    });
}
/**
 * Convert a single PostDraft to server DraftPost format.
 */
function postDraftToServerPost(post, localRefPaths) {
    return __awaiter(this, void 0, void 0, function () {
        var draftPost, video, external_1, resolved;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    draftPost = {
                        $type: 'app.bsky.draft.defs#draftPost',
                        text: post.richtext.text,
                    };
                    // Add labels if present
                    if (post.labels.length > 0) {
                        draftPost.labels = {
                            $type: 'com.atproto.label.defs#selfLabels',
                            values: post.labels.map(function (label) { return ({ val: label }); }),
                        };
                    }
                    if (!post.embed.media) return [3 /*break*/, 4];
                    if (!(post.embed.media.type === 'images')) return [3 /*break*/, 1];
                    draftPost.embedImages = serializeImages(post.embed.media.images, localRefPaths);
                    return [3 /*break*/, 4];
                case 1:
                    if (!(post.embed.media.type === 'video')) return [3 /*break*/, 3];
                    return [4 /*yield*/, serializeVideo(post.embed.media.video, localRefPaths)];
                case 2:
                    video = _a.sent();
                    if (video) {
                        draftPost.embedVideos = [video];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    if (post.embed.media.type === 'gif') {
                        external_1 = serializeGif(post.embed.media);
                        if (external_1) {
                            draftPost.embedExternals = [external_1];
                        }
                    }
                    _a.label = 4;
                case 4:
                    if (!post.embed.quote) return [3 /*break*/, 6];
                    return [4 /*yield*/, resolveLink(createPublicAgent(), post.embed.quote.uri)];
                case 5:
                    resolved = _a.sent();
                    if (resolved && resolved.type === 'record') {
                        draftPost.embedRecords = [
                            {
                                $type: 'app.bsky.draft.defs#draftEmbedRecord',
                                record: {
                                    uri: resolved.record.uri,
                                    cid: resolved.record.cid,
                                },
                            },
                        ];
                    }
                    _a.label = 6;
                case 6:
                    // Add external link embed (only if no media, otherwise it's ignored)
                    if (post.embed.link && !post.embed.media) {
                        draftPost.embedExternals = [
                            {
                                $type: 'app.bsky.draft.defs#draftEmbedExternal',
                                uri: post.embed.link.uri,
                            },
                        ];
                    }
                    return [2 /*return*/, draftPost];
            }
        });
    });
}
/**
 * Serialize images to server format with localRef paths.
 * Reuses existing localRefPath if present (when editing a draft),
 * otherwise generates a new one.
 */
function serializeImages(images, localRefPaths) {
    return images.map(function (image) {
        var _a;
        var sourcePath = ((_a = image.transformed) === null || _a === void 0 ? void 0 : _a.path) || image.source.path;
        // Reuse existing localRefPath if present (editing draft), otherwise generate new
        var isReusing = !!image.localRefPath;
        var localRefPath = image.localRefPath || "image:".concat(nanoid());
        localRefPaths.set(localRefPath, sourcePath);
        logger.debug('serializing image', {
            localRefPath: localRefPath,
            isReusing: isReusing,
            sourcePath: sourcePath,
        });
        return {
            $type: 'app.bsky.draft.defs#draftEmbedImage',
            localRef: {
                $type: 'app.bsky.draft.defs#draftEmbedLocalRef',
                path: localRefPath,
            },
            alt: image.alt || undefined,
        };
    });
}
/**
 * Serialize video to server format with localRef path.
 * The localRef path encodes the mime type: `video:${mimeType}:${nanoid()}`
 */
function serializeVideo(videoState, localRefPaths) {
    return __awaiter(this, void 0, void 0, function () {
        var mimeType, ext, localRefPath, captions, _i, _a, caption, content;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Only save videos that have been compressed (have a video file)
                    if (!videoState.video) {
                        return [2 /*return*/, undefined];
                    }
                    mimeType = videoState.video.mimeType || 'video/mp4';
                    ext = mimeToExt(mimeType);
                    localRefPath = "video:".concat(mimeType, ":").concat(nanoid(), ".").concat(ext);
                    localRefPaths.set(localRefPath, videoState.video.uri);
                    captions = [];
                    _i = 0, _a = videoState.captions;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    caption = _a[_i];
                    if (!caption.lang) return [3 /*break*/, 3];
                    return [4 /*yield*/, caption.file.text()];
                case 2:
                    content = _b.sent();
                    captions.push({
                        $type: 'app.bsky.draft.defs#draftEmbedCaption',
                        lang: caption.lang,
                        content: content,
                    });
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, {
                        $type: 'app.bsky.draft.defs#draftEmbedVideo',
                        localRef: {
                            $type: 'app.bsky.draft.defs#draftEmbedLocalRef',
                            path: localRefPath,
                        },
                        alt: videoState.altText || undefined,
                        captions: captions.length > 0 ? captions : undefined,
                    }];
            }
        });
    });
}
/**
 * Serialize GIF to server format as external embed.
 * URL format: https://media.tenor.com/{id}/{filename}.gif?hh=HEIGHT&ww=WIDTH&alt=ALT_TEXT
 */
function serializeGif(gifMedia) {
    var gif = gifMedia.gif;
    var gifFormat = gif.media_formats.gif || gif.media_formats.tinygif;
    if (!(gifFormat === null || gifFormat === void 0 ? void 0 : gifFormat.url)) {
        return undefined;
    }
    // Build URL with dimensions and alt text in query params
    var url = new URL(gifFormat.url);
    if (gifFormat.dims) {
        url.searchParams.set('ww', String(gifFormat.dims[0]));
        url.searchParams.set('hh', String(gifFormat.dims[1]));
    }
    // Store alt text if present
    if (gifMedia.alt) {
        url.searchParams.set('alt', gifMedia.alt);
    }
    return {
        $type: 'app.bsky.draft.defs#draftEmbedExternal',
        uri: url.toString(),
    };
}
/**
 * Convert server DraftView to DraftSummary for list display.
 * Also checks which media files exist locally.
 */
export function draftViewToSummary(_a) {
    var view = _a.view, analytics = _a.analytics;
    var meta = {
        isOriginatingDevice: view.draft.deviceId === getDeviceId(),
        postCount: view.draft.posts.length,
        // minus anchor post
        replyCount: view.draft.posts.length - 1,
        hasMedia: false,
        hasMissingMedia: false,
        mediaCount: 0,
        hasQuotes: false,
        quoteCount: 0,
    };
    var posts = view.draft.posts.map(function (post, index) {
        var images = [];
        var videos = [];
        var gif;
        // Process images
        if (post.embedImages) {
            for (var _i = 0, _a = post.embedImages; _i < _a.length; _i++) {
                var img = _a[_i];
                meta.mediaCount++;
                meta.hasMedia = true;
                var exists = storage.mediaExists(img.localRef.path);
                if (!exists) {
                    meta.hasMissingMedia = true;
                }
                images.push({
                    localPath: img.localRef.path,
                    altText: img.alt || '',
                    exists: exists,
                });
            }
        }
        // Process videos
        if (post.embedVideos) {
            for (var _b = 0, _c = post.embedVideos; _b < _c.length; _b++) {
                var vid = _c[_b];
                meta.mediaCount++;
                meta.hasMedia = true;
                var exists = storage.mediaExists(vid.localRef.path);
                if (!exists) {
                    meta.hasMissingMedia = true;
                }
                videos.push({
                    localPath: vid.localRef.path,
                    altText: vid.alt || '',
                    exists: exists,
                });
            }
        }
        // Process externals (check for GIFs)
        if (post.embedExternals) {
            for (var _d = 0, _e = post.embedExternals; _d < _e.length; _d++) {
                var ext = _e[_d];
                var gifData = parseGifFromUrl(ext.uri);
                if (gifData) {
                    meta.mediaCount++;
                    meta.hasMedia = true;
                    gif = gifData;
                }
            }
        }
        if (post.embedRecords && post.embedRecords.length > 0) {
            meta.quoteCount += post.embedRecords.length;
            meta.hasQuotes = true;
        }
        return {
            id: "post-".concat(index),
            text: post.text || '',
            images: images.length > 0 ? images : undefined,
            video: videos[0], // Only one video per post
            gif: gif,
        };
    });
    if (meta.isOriginatingDevice && meta.hasMissingMedia) {
        analytics.logger.warn("Draft is missing media on originating device", {});
    }
    return {
        id: view.id,
        createdAt: view.createdAt,
        updatedAt: view.updatedAt,
        draft: view.draft,
        posts: posts,
        meta: meta,
    };
}
/**
 * Parse GIF data from a Tenor URL.
 * URL format: https://media.tenor.com/{id}/{filename}.gif?hh=HEIGHT&ww=WIDTH&alt=ALT_TEXT
 */
function parseGifFromUrl(uri) {
    try {
        var url = new URL(uri);
        if (url.hostname !== TENOR_HOSTNAME) {
            return undefined;
        }
        var height = parseInt(url.searchParams.get('hh') || '', 10);
        var width = parseInt(url.searchParams.get('ww') || '', 10);
        var alt = url.searchParams.get('alt') || '';
        if (!height || !width) {
            return undefined;
        }
        // Strip our custom params to get clean base URL
        // This prevents double query strings when resolveGif() adds params again
        url.searchParams.delete('ww');
        url.searchParams.delete('hh');
        url.searchParams.delete('alt');
        return { url: url.toString(), width: width, height: height, alt: alt };
    }
    catch (_a) {
        return undefined;
    }
}
/**
 * Convert server Draft back to composer-compatible format for restoration.
 * Returns posts and a map of videos that need to be restored by re-processing.
 *
 * Videos cannot be restored synchronously like images because they need to go through
 * the compression and upload pipeline. The caller should handle the restoredVideos
 * by initiating video processing for each entry.
 */
export function draftToComposerPosts(draft, loadedMedia) {
    return __awaiter(this, void 0, void 0, function () {
        var restoredVideos, posts;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    restoredVideos = new Map();
                    return [4 /*yield*/, Promise.all(draft.posts.map(function (post, index) { return __awaiter(_this, void 0, void 0, function () {
                            var richtext, embed, imagePromises, images, _i, _a, ext, gifData, mediaObject, vid, videoUri, mimeType, record, urip, url, _b, _c, ext, gifData, labels, _d, _e, val;
                            var _this = this;
                            var _f, _g, _h, _j;
                            return __generator(this, function (_k) {
                                switch (_k.label) {
                                    case 0:
                                        richtext = new RichText({ text: post.text || '' });
                                        richtext.detectFacetsWithoutResolution();
                                        embed = {
                                            quote: undefined,
                                            link: undefined,
                                            media: undefined,
                                        };
                                        if (!(post.embedImages && post.embedImages.length > 0)) return [3 /*break*/, 2];
                                        imagePromises = post.embedImages.map(function (img) { return __awaiter(_this, void 0, void 0, function () {
                                            var path, width, height, dims, e_1;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        path = loadedMedia.get(img.localRef.path);
                                                        if (!path) {
                                                            return [2 /*return*/, null];
                                                        }
                                                        width = 0;
                                                        height = 0;
                                                        _a.label = 1;
                                                    case 1:
                                                        _a.trys.push([1, 3, , 4]);
                                                        return [4 /*yield*/, getImageDim(path)];
                                                    case 2:
                                                        dims = _a.sent();
                                                        width = dims.width;
                                                        height = dims.height;
                                                        return [3 /*break*/, 4];
                                                    case 3:
                                                        e_1 = _a.sent();
                                                        logger.warn('Failed to get image dimensions', {
                                                            path: path,
                                                            error: e_1,
                                                        });
                                                        return [3 /*break*/, 4];
                                                    case 4:
                                                        logger.debug('restoring image with localRefPath', {
                                                            localRefPath: img.localRef.path,
                                                            loadedPath: path,
                                                            width: width,
                                                            height: height,
                                                        });
                                                        return [2 /*return*/, {
                                                                alt: img.alt || '',
                                                                // Preserve the original localRefPath for reuse when saving
                                                                localRefPath: img.localRef.path,
                                                                source: {
                                                                    id: nanoid(),
                                                                    path: path,
                                                                    width: width,
                                                                    height: height,
                                                                    mime: 'image/jpeg',
                                                                },
                                                            }];
                                                }
                                            });
                                        }); });
                                        return [4 /*yield*/, Promise.all(imagePromises)];
                                    case 1:
                                        images = (_k.sent()).filter(function (img) { return img !== null; });
                                        if (images.length > 0) {
                                            embed.media = { type: 'images', images: images };
                                        }
                                        _k.label = 2;
                                    case 2:
                                        // Restore GIF from external embed
                                        if (post.embedExternals) {
                                            for (_i = 0, _a = post.embedExternals; _i < _a.length; _i++) {
                                                ext = _a[_i];
                                                gifData = parseGifFromUrl(ext.uri);
                                                if (gifData) {
                                                    mediaObject = {
                                                        url: gifData.url,
                                                        dims: [gifData.width, gifData.height],
                                                        duration: 0,
                                                        size: 0,
                                                    };
                                                    embed.media = {
                                                        type: 'gif',
                                                        gif: {
                                                            id: '',
                                                            created: 0,
                                                            hasaudio: false,
                                                            hascaption: false,
                                                            flags: '',
                                                            tags: [],
                                                            title: '',
                                                            content_description: gifData.alt || '',
                                                            itemurl: '',
                                                            url: gifData.url, // Required for useResolveGifQuery
                                                            media_formats: {
                                                                gif: mediaObject,
                                                                tinygif: mediaObject,
                                                                preview: mediaObject,
                                                            },
                                                        },
                                                        alt: gifData.alt,
                                                    };
                                                    break;
                                                }
                                            }
                                        }
                                        // Collect video for restoration (processed async by caller)
                                        if (post.embedVideos && post.embedVideos.length > 0) {
                                            vid = post.embedVideos[0];
                                            videoUri = loadedMedia.get(vid.localRef.path);
                                            if (videoUri) {
                                                mimeType = parseVideoMimeType(vid.localRef.path);
                                                logger.debug('found video to restore', {
                                                    localRefPath: vid.localRef.path,
                                                    videoUri: videoUri,
                                                    altText: vid.alt,
                                                    mimeType: mimeType,
                                                    captionCount: (_g = (_f = vid.captions) === null || _f === void 0 ? void 0 : _f.length) !== null && _g !== void 0 ? _g : 0,
                                                });
                                                restoredVideos.set(index, {
                                                    uri: videoUri,
                                                    altText: vid.alt || '',
                                                    mimeType: mimeType,
                                                    localRefPath: vid.localRef.path,
                                                    captions: (_j = (_h = vid.captions) === null || _h === void 0 ? void 0 : _h.map(function (c) { return ({ lang: c.lang, content: c.content }); })) !== null && _j !== void 0 ? _j : [],
                                                });
                                            }
                                        }
                                        // Restore quote embed
                                        if (post.embedRecords && post.embedRecords.length > 0) {
                                            record = post.embedRecords[0];
                                            urip = new AtUri(record.record.uri);
                                            url = "https://bsky.app/profile/".concat(urip.host, "/post/").concat(urip.rkey);
                                            embed.quote = { type: 'link', uri: url };
                                        }
                                        // Restore link embed (only if not a GIF)
                                        if (post.embedExternals && !embed.media) {
                                            for (_b = 0, _c = post.embedExternals; _b < _c.length; _b++) {
                                                ext = _c[_b];
                                                gifData = parseGifFromUrl(ext.uri);
                                                if (!gifData) {
                                                    embed.link = { type: 'link', uri: ext.uri };
                                                    break;
                                                }
                                            }
                                        }
                                        labels = [];
                                        if (post.labels && 'values' in post.labels) {
                                            for (_d = 0, _e = post.labels.values; _d < _e.length; _d++) {
                                                val = _e[_d];
                                                labels.push(val.val);
                                            }
                                        }
                                        return [2 /*return*/, {
                                                id: "draft-post-".concat(index),
                                                richtext: richtext,
                                                shortenedGraphemeLength: richtext.graphemeLength,
                                                labels: labels,
                                                embed: embed,
                                            }];
                                }
                            });
                        }); }))];
                case 1:
                    posts = _a.sent();
                    return [2 /*return*/, { posts: posts, restoredVideos: restoredVideos }];
            }
        });
    });
}
/**
 * Convert server threadgate rules back to UI settings.
 */
export function threadgateToUISettings(threadgateAllow) {
    if (!threadgateAllow) {
        return [];
    }
    return threadgateAllow
        .map(function (rule) {
        if ('$type' in rule) {
            if (rule.$type === 'app.bsky.feed.threadgate#mentionRule') {
                return { type: 'mention' };
            }
            if (rule.$type === 'app.bsky.feed.threadgate#followingRule') {
                return { type: 'following' };
            }
            if (rule.$type === 'app.bsky.feed.threadgate#followerRule') {
                return { type: 'followers' };
            }
            if (rule.$type === 'app.bsky.feed.threadgate#listRule' &&
                'list' in rule) {
                return { type: 'list', list: rule.list };
            }
        }
        return null;
    })
        .filter(function (s) { return s !== null; });
}
/**
 * Extract all localRef paths from a draft.
 * Used to identify which media files belong to a draft for cleanup.
 */
export function extractLocalRefs(draft) {
    var refs = new Set();
    for (var _i = 0, _a = draft.posts; _i < _a.length; _i++) {
        var post = _a[_i];
        if (post.embedImages) {
            for (var _b = 0, _c = post.embedImages; _b < _c.length; _b++) {
                var img = _c[_b];
                refs.add(img.localRef.path);
            }
        }
        if (post.embedVideos) {
            for (var _d = 0, _e = post.embedVideos; _d < _e.length; _d++) {
                var vid = _e[_d];
                refs.add(vid.localRef.path);
            }
        }
    }
    logger.debug('extracted localRefs from draft', {
        count: refs.size,
        refs: Array.from(refs),
    });
    return refs;
}

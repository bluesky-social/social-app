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
import { useEffect, useMemo, useState } from 'react';
import { AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, } from '@atproto/api';
import EventEmitter from 'eventemitter3';
import { batchedUpdates } from '#/lib/batchedUpdates';
import { findAllPostsInQueryData as findAllPostsInBookmarksQueryData } from '#/state/queries/bookmarks/useBookmarksQuery';
import { findAllPostsInQueryData as findAllPostsInExploreFeedPreviewsQueryData } from '#/state/queries/explore-feed-previews';
import { findAllPostsInQueryData as findAllPostsInNotifsQueryData } from '#/state/queries/notifications/feed';
import { findAllPostsInQueryData as findAllPostsInFeedQueryData } from '#/state/queries/post-feed';
import { findAllPostsInQueryData as findAllPostsInQuoteQueryData } from '#/state/queries/post-quotes';
import { findAllPostsInQueryData as findAllPostsInSearchQueryData } from '#/state/queries/search-posts';
import { findAllPostsInQueryData as findAllPostsInThreadV2QueryData } from '#/state/queries/usePostThread/queryCache';
import { castAsShadow } from './types';
export var POST_TOMBSTONE = Symbol('PostTombstone');
var emitter = new EventEmitter();
var shadows = new WeakMap();
/**
 * Use with caution! This function returns the raw shadow data for a post.
 * Prefer using `usePostShadow`.
 */
export function dangerousGetPostShadow(post) {
    return shadows.get(post);
}
export function usePostShadow(post) {
    var _a = useState(function () { return shadows.get(post); }), shadow = _a[0], setShadow = _a[1];
    var _b = useState(post), prevPost = _b[0], setPrevPost = _b[1];
    if (post !== prevPost) {
        setPrevPost(post);
        setShadow(shadows.get(post));
    }
    useEffect(function () {
        function onUpdate() {
            setShadow(shadows.get(post));
        }
        emitter.addListener(post.uri, onUpdate);
        return function () {
            emitter.removeListener(post.uri, onUpdate);
        };
    }, [post, setShadow]);
    return useMemo(function () {
        if (shadow) {
            return mergeShadow(post, shadow);
        }
        else {
            return castAsShadow(post);
        }
    }, [post, shadow]);
}
function mergeShadow(post, shadow) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (shadow.isDeleted) {
        return POST_TOMBSTONE;
    }
    var likeCount = (_a = post.likeCount) !== null && _a !== void 0 ? _a : 0;
    if ('likeUri' in shadow) {
        var wasLiked = !!((_b = post.viewer) === null || _b === void 0 ? void 0 : _b.like);
        var isLiked = !!shadow.likeUri;
        if (wasLiked && !isLiked) {
            likeCount--;
        }
        else if (!wasLiked && isLiked) {
            likeCount++;
        }
        likeCount = Math.max(0, likeCount);
    }
    var bookmarkCount = (_c = post.bookmarkCount) !== null && _c !== void 0 ? _c : 0;
    if ('bookmarked' in shadow) {
        var wasBookmarked = !!((_d = post.viewer) === null || _d === void 0 ? void 0 : _d.bookmarked);
        var isBookmarked = !!shadow.bookmarked;
        if (wasBookmarked && !isBookmarked) {
            bookmarkCount--;
        }
        else if (!wasBookmarked && isBookmarked) {
            bookmarkCount++;
        }
        bookmarkCount = Math.max(0, bookmarkCount);
    }
    var repostCount = (_e = post.repostCount) !== null && _e !== void 0 ? _e : 0;
    if ('repostUri' in shadow) {
        var wasReposted = !!((_f = post.viewer) === null || _f === void 0 ? void 0 : _f.repost);
        var isReposted = !!shadow.repostUri;
        if (wasReposted && !isReposted) {
            repostCount--;
        }
        else if (!wasReposted && isReposted) {
            repostCount++;
        }
        repostCount = Math.max(0, repostCount);
    }
    var replyCount = (_g = post.replyCount) !== null && _g !== void 0 ? _g : 0;
    if ('optimisticReplyCount' in shadow) {
        replyCount = (_h = shadow.optimisticReplyCount) !== null && _h !== void 0 ? _h : replyCount;
    }
    var embed;
    if ('embed' in shadow) {
        if ((AppBskyEmbedRecord.isView(post.embed) &&
            AppBskyEmbedRecord.isView(shadow.embed)) ||
            (AppBskyEmbedRecordWithMedia.isView(post.embed) &&
                AppBskyEmbedRecordWithMedia.isView(shadow.embed))) {
            embed = shadow.embed;
        }
    }
    return castAsShadow(__assign(__assign({}, post), { embed: embed || post.embed, likeCount: likeCount, repostCount: repostCount, replyCount: replyCount, bookmarkCount: bookmarkCount, viewer: __assign(__assign({}, (post.viewer || {})), { like: 'likeUri' in shadow ? shadow.likeUri : (_j = post.viewer) === null || _j === void 0 ? void 0 : _j.like, repost: 'repostUri' in shadow ? shadow.repostUri : (_k = post.viewer) === null || _k === void 0 ? void 0 : _k.repost, pinned: 'pinned' in shadow ? shadow.pinned : (_l = post.viewer) === null || _l === void 0 ? void 0 : _l.pinned, bookmarked: 'bookmarked' in shadow ? shadow.bookmarked : (_m = post.viewer) === null || _m === void 0 ? void 0 : _m.bookmarked }) }));
}
export function updatePostShadow(queryClient, uri, value) {
    var cachedPosts = findPostsInCache(queryClient, uri);
    for (var _i = 0, cachedPosts_1 = cachedPosts; _i < cachedPosts_1.length; _i++) {
        var post = cachedPosts_1[_i];
        shadows.set(post, __assign(__assign({}, shadows.get(post)), value));
    }
    batchedUpdates(function () {
        emitter.emit(uri);
    });
}
function findPostsInCache(queryClient, uri) {
    var _i, _a, post, _b, _c, post, _d, _e, post, _f, _g, post, _h, _j, post, _k, _l, post, _m, _o, post;
    return __generator(this, function (_p) {
        switch (_p.label) {
            case 0:
                _i = 0, _a = findAllPostsInFeedQueryData(queryClient, uri);
                _p.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                post = _a[_i];
                return [4 /*yield*/, post];
            case 2:
                _p.sent();
                _p.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                _b = 0, _c = findAllPostsInNotifsQueryData(queryClient, uri);
                _p.label = 5;
            case 5:
                if (!(_b < _c.length)) return [3 /*break*/, 8];
                post = _c[_b];
                return [4 /*yield*/, post];
            case 6:
                _p.sent();
                _p.label = 7;
            case 7:
                _b++;
                return [3 /*break*/, 5];
            case 8:
                _d = 0, _e = findAllPostsInThreadV2QueryData(queryClient, uri);
                _p.label = 9;
            case 9:
                if (!(_d < _e.length)) return [3 /*break*/, 12];
                post = _e[_d];
                return [4 /*yield*/, post];
            case 10:
                _p.sent();
                _p.label = 11;
            case 11:
                _d++;
                return [3 /*break*/, 9];
            case 12:
                _f = 0, _g = findAllPostsInSearchQueryData(queryClient, uri);
                _p.label = 13;
            case 13:
                if (!(_f < _g.length)) return [3 /*break*/, 16];
                post = _g[_f];
                return [4 /*yield*/, post];
            case 14:
                _p.sent();
                _p.label = 15;
            case 15:
                _f++;
                return [3 /*break*/, 13];
            case 16:
                _h = 0, _j = findAllPostsInQuoteQueryData(queryClient, uri);
                _p.label = 17;
            case 17:
                if (!(_h < _j.length)) return [3 /*break*/, 20];
                post = _j[_h];
                return [4 /*yield*/, post];
            case 18:
                _p.sent();
                _p.label = 19;
            case 19:
                _h++;
                return [3 /*break*/, 17];
            case 20:
                _k = 0, _l = findAllPostsInExploreFeedPreviewsQueryData(queryClient, uri);
                _p.label = 21;
            case 21:
                if (!(_k < _l.length)) return [3 /*break*/, 24];
                post = _l[_k];
                return [4 /*yield*/, post];
            case 22:
                _p.sent();
                _p.label = 23;
            case 23:
                _k++;
                return [3 /*break*/, 21];
            case 24:
                _m = 0, _o = findAllPostsInBookmarksQueryData(queryClient, uri);
                _p.label = 25;
            case 25:
                if (!(_m < _o.length)) return [3 /*break*/, 28];
                post = _o[_m];
                return [4 /*yield*/, post];
            case 26:
                _p.sent();
                _p.label = 27;
            case 27:
                _m++;
                return [3 /*break*/, 25];
            case 28: return [2 /*return*/];
        }
    });
}

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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { AppBskyRichtextFacet, RichText, } from '@atproto/api';
import { nanoid } from 'nanoid/non-secure';
import { insertMentionAt } from '#/lib/strings/mention-manip';
import { shortenLinks } from '#/lib/strings/rich-text-manip';
import { isBskyPostUrl, postUriToRelativePath, toBskyAppUrl, } from '#/lib/strings/url-helpers';
import { createInitialImages } from '#/state/gallery';
import { createPostgateRecord } from '#/state/queries/postgate/util';
import { threadgateRecordToAllowUISetting } from '#/state/queries/threadgate';
import { suggestLinkCardUri, } from '#/view/com/composer/text-input/text-input-util';
import { createVideoState, videoReducer, } from './video';
export var MAX_IMAGES = 4;
export function composerReducer(state, action) {
    var _a;
    switch (action.type) {
        case 'update_postgate': {
            return __assign(__assign({}, state), { isDirty: true, thread: __assign(__assign({}, state.thread), { postgate: action.postgate }) });
        }
        case 'update_threadgate': {
            return __assign(__assign({}, state), { isDirty: true, thread: __assign(__assign({}, state.thread), { threadgate: action.threadgate }) });
        }
        case 'update_post': {
            var nextPosts = state.thread.posts;
            var postIndex = state.thread.posts.findIndex(function (p) { return p.id === action.postId; });
            if (postIndex !== -1) {
                nextPosts = state.thread.posts.slice();
                nextPosts[postIndex] = postReducer(state.thread.posts[postIndex], action.postAction);
            }
            return __assign(__assign({}, state), { isDirty: true, thread: __assign(__assign({}, state.thread), { posts: nextPosts }) });
        }
        case 'add_post': {
            var activePostIndex = state.activePostIndex;
            var nextPosts = __spreadArray([], state.thread.posts, true);
            nextPosts.splice(activePostIndex + 1, 0, {
                id: nanoid(),
                richtext: new RichText({ text: '' }),
                shortenedGraphemeLength: 0,
                labels: [],
                embed: {
                    quote: undefined,
                    media: undefined,
                    link: undefined,
                },
            });
            return __assign(__assign({}, state), { isDirty: true, thread: __assign(__assign({}, state.thread), { posts: nextPosts }) });
        }
        case 'remove_post': {
            if (state.thread.posts.length < 2) {
                return state;
            }
            var nextActivePostIndex = state.activePostIndex;
            var indexToRemove = state.thread.posts.findIndex(function (p) { return p.id === action.postId; });
            var nextPosts = __spreadArray([], state.thread.posts, true);
            if (indexToRemove !== -1) {
                var postToRemove = state.thread.posts[indexToRemove];
                if (((_a = postToRemove.embed.media) === null || _a === void 0 ? void 0 : _a.type) === 'video') {
                    postToRemove.embed.media.video.abortController.abort();
                }
                nextPosts.splice(indexToRemove, 1);
                nextActivePostIndex = Math.max(0, indexToRemove - 1);
            }
            return __assign(__assign({}, state), { isDirty: true, activePostIndex: nextActivePostIndex, mutableNeedsFocusActive: true, thread: __assign(__assign({}, state.thread), { posts: nextPosts }) });
        }
        case 'focus_post': {
            var nextActivePostIndex = state.thread.posts.findIndex(function (p) { return p.id === action.postId; });
            if (nextActivePostIndex === -1) {
                return state;
            }
            return __assign(__assign({}, state), { activePostIndex: nextActivePostIndex });
        }
        case 'restore_from_draft': {
            var draftId = action.draftId, posts = action.posts, threadgateAllow = action.threadgateAllow, postgateEmbeddingRules = action.postgateEmbeddingRules, loadedMedia = action.loadedMedia, originalLocalRefs = action.originalLocalRefs;
            return {
                activePostIndex: 0,
                mutableNeedsFocusActive: true,
                draftId: draftId,
                isDirty: false,
                loadedMediaMap: loadedMedia,
                originalLocalRefs: originalLocalRefs,
                thread: {
                    posts: posts,
                    postgate: createPostgateRecord({
                        post: '',
                        embeddingRules: postgateEmbeddingRules,
                    }),
                    threadgate: threadgateRecordToAllowUISetting({
                        $type: 'app.bsky.feed.threadgate',
                        post: '',
                        createdAt: new Date().toString(),
                        allow: threadgateAllow,
                    }),
                },
            };
        }
        case 'clear': {
            return createComposerState({
                initText: undefined,
                initMention: undefined,
                initImageUris: [],
                initQuoteUri: undefined,
                initInteractionSettings: action.initInteractionSettings,
            });
        }
        case 'mark_saved': {
            return __assign(__assign({}, state), { isDirty: false, draftId: action.draftId });
        }
    }
}
function postReducer(state, action) {
    switch (action.type) {
        case 'update_richtext': {
            return __assign(__assign({}, state), { richtext: action.richtext, shortenedGraphemeLength: getShortenedLength(action.richtext) });
        }
        case 'update_labels': {
            return __assign(__assign({}, state), { labels: action.labels });
        }
        case 'embed_add_images': {
            if (action.images.length === 0) {
                return state;
            }
            var prevMedia = state.embed.media;
            var nextMedia = prevMedia;
            if (!prevMedia) {
                nextMedia = {
                    type: 'images',
                    images: action.images.slice(0, MAX_IMAGES),
                };
            }
            else if (prevMedia.type === 'images') {
                nextMedia = __assign(__assign({}, prevMedia), { images: __spreadArray(__spreadArray([], prevMedia.images, true), action.images, true).slice(0, MAX_IMAGES) });
            }
            return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
        }
        case 'embed_update_image': {
            var prevMedia = state.embed.media;
            if ((prevMedia === null || prevMedia === void 0 ? void 0 : prevMedia.type) === 'images') {
                var updatedImage_1 = action.image;
                var nextMedia = __assign(__assign({}, prevMedia), { images: prevMedia.images.map(function (img) {
                        if (img.source.id === updatedImage_1.source.id) {
                            return updatedImage_1;
                        }
                        return img;
                    }) });
                return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
            }
            return state;
        }
        case 'embed_remove_image': {
            var prevMedia = state.embed.media;
            var nextLabels = state.labels;
            if ((prevMedia === null || prevMedia === void 0 ? void 0 : prevMedia.type) === 'images') {
                var removedImage_1 = action.image;
                var nextMedia = __assign(__assign({}, prevMedia), { images: prevMedia.images.filter(function (img) {
                        return img.source.id !== removedImage_1.source.id;
                    }) });
                if (nextMedia.images.length === 0) {
                    nextMedia = undefined;
                    if (!state.embed.link) {
                        nextLabels = [];
                    }
                }
                return __assign(__assign({}, state), { labels: nextLabels, embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
            }
            return state;
        }
        case 'embed_add_video': {
            var prevMedia = state.embed.media;
            var nextMedia = prevMedia;
            if (!prevMedia) {
                nextMedia = {
                    type: 'video',
                    video: createVideoState(action.asset, action.abortController),
                };
            }
            return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
        }
        case 'embed_update_video': {
            var videoAction = action.videoAction;
            var prevMedia = state.embed.media;
            var nextMedia = prevMedia;
            if ((prevMedia === null || prevMedia === void 0 ? void 0 : prevMedia.type) === 'video') {
                nextMedia = __assign(__assign({}, prevMedia), { video: videoReducer(prevMedia.video, videoAction) });
            }
            return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
        }
        case 'embed_remove_video': {
            var prevMedia = state.embed.media;
            var nextMedia = prevMedia;
            if ((prevMedia === null || prevMedia === void 0 ? void 0 : prevMedia.type) === 'video') {
                prevMedia.video.abortController.abort();
                nextMedia = undefined;
            }
            var nextLabels = state.labels;
            if (!state.embed.link) {
                nextLabels = [];
            }
            return __assign(__assign({}, state), { labels: nextLabels, embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
        }
        case 'embed_add_uri': {
            var prevQuote = state.embed.quote;
            var prevLink = state.embed.link;
            var nextQuote = prevQuote;
            var nextLink = prevLink;
            if (isBskyPostUrl(action.uri)) {
                if (!prevQuote) {
                    nextQuote = {
                        type: 'link',
                        uri: action.uri,
                    };
                }
            }
            else {
                if (!prevLink) {
                    nextLink = {
                        type: 'link',
                        uri: action.uri,
                    };
                }
            }
            return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { quote: nextQuote, link: nextLink }) });
        }
        case 'embed_remove_link': {
            var nextLabels = state.labels;
            if (!state.embed.media) {
                nextLabels = [];
            }
            return __assign(__assign({}, state), { labels: nextLabels, embed: __assign(__assign({}, state.embed), { link: undefined }) });
        }
        case 'embed_remove_quote': {
            return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { quote: undefined }) });
        }
        case 'embed_add_gif': {
            var prevMedia = state.embed.media;
            var nextMedia = prevMedia;
            if (!prevMedia) {
                nextMedia = {
                    type: 'gif',
                    gif: action.gif,
                    alt: '',
                };
            }
            return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
        }
        case 'embed_update_gif': {
            var prevMedia = state.embed.media;
            var nextMedia = prevMedia;
            if ((prevMedia === null || prevMedia === void 0 ? void 0 : prevMedia.type) === 'gif') {
                nextMedia = __assign(__assign({}, prevMedia), { alt: action.alt });
            }
            return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
        }
        case 'embed_remove_gif': {
            var prevMedia = state.embed.media;
            var nextMedia = prevMedia;
            if ((prevMedia === null || prevMedia === void 0 ? void 0 : prevMedia.type) === 'gif') {
                nextMedia = undefined;
            }
            return __assign(__assign({}, state), { embed: __assign(__assign({}, state.embed), { media: nextMedia }) });
        }
    }
}
export function createComposerState(_a) {
    var initText = _a.initText, initMention = _a.initMention, initImageUris = _a.initImageUris, initQuoteUri = _a.initQuoteUri, initInteractionSettings = _a.initInteractionSettings;
    var media;
    if (initImageUris === null || initImageUris === void 0 ? void 0 : initImageUris.length) {
        media = {
            type: 'images',
            images: createInitialImages(initImageUris),
        };
    }
    var quote;
    if (initQuoteUri) {
        // TODO: Consider passing the app url directly.
        var path = postUriToRelativePath(initQuoteUri);
        if (path) {
            quote = {
                type: 'link',
                uri: toBskyAppUrl(path),
            };
        }
    }
    var initRichText = new RichText({
        text: initText
            ? initText
            : initMention
                ? insertMentionAt("@".concat(initMention), initMention.length + 1, "".concat(initMention))
                : '',
    });
    var link;
    /**
     * `initText` atm is only used for compose intents, meaning share links from
     * external sources. If `initText` is defined, we want to extract links/posts
     * from `initText` and suggest them as embeds.
     *
     * This checks for posts separately from other types of links so that posts
     * can become quotes. The util `suggestLinkCardUri` is then applied to ensure
     * we suggest at most 1 of each.
     */
    if (initText) {
        initRichText.detectFacetsWithoutResolution();
        var detectedExtUris = new Map();
        var detectedPostUris = new Map();
        if (initRichText.facets) {
            for (var _i = 0, _b = initRichText.facets; _i < _b.length; _i++) {
                var facet = _b[_i];
                for (var _c = 0, _d = facet.features; _c < _d.length; _c++) {
                    var feature = _d[_c];
                    if (AppBskyRichtextFacet.isLink(feature)) {
                        if (isBskyPostUrl(feature.uri)) {
                            detectedPostUris.set(feature.uri, { facet: facet, rt: initRichText });
                        }
                        else {
                            detectedExtUris.set(feature.uri, { facet: facet, rt: initRichText });
                        }
                    }
                }
            }
        }
        var pastSuggestedUris = new Set();
        var suggestedExtUri = suggestLinkCardUri(true, detectedExtUris, new Map(), pastSuggestedUris);
        if (suggestedExtUri) {
            link = {
                type: 'link',
                uri: suggestedExtUri,
            };
        }
        var suggestedPostUri = suggestLinkCardUri(true, detectedPostUris, new Map(), pastSuggestedUris);
        if (suggestedPostUri) {
            /*
             * `initQuote` is only populated via in-app user action, but we're being
             * future-defensive here.
             */
            if (!quote) {
                quote = {
                    type: 'link',
                    uri: suggestedPostUri,
                };
            }
        }
    }
    else if (initMention) {
        // highlight the mention
        initRichText.detectFacetsWithoutResolution();
    }
    return {
        activePostIndex: 0,
        mutableNeedsFocusActive: false,
        isDirty: false,
        thread: {
            posts: [
                {
                    id: nanoid(),
                    richtext: initRichText,
                    shortenedGraphemeLength: getShortenedLength(initRichText),
                    labels: [],
                    embed: {
                        quote: quote,
                        media: media,
                        link: link,
                    },
                },
            ],
            postgate: createPostgateRecord({
                post: '',
                embeddingRules: (initInteractionSettings === null || initInteractionSettings === void 0 ? void 0 : initInteractionSettings.postgateEmbeddingRules) || [],
            }),
            threadgate: threadgateRecordToAllowUISetting({
                $type: 'app.bsky.feed.threadgate',
                post: '',
                createdAt: new Date().toString(),
                allow: initInteractionSettings === null || initInteractionSettings === void 0 ? void 0 : initInteractionSettings.threadgateAllowRules,
            }),
        },
    };
}
function getShortenedLength(rt) {
    return shortenLinks(rt).graphemeLength;
}

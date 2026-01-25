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
import { AppBskyEmbedRecord, AppBskyEmbedRecordWithMedia, AtUri, } from '@atproto/api';
export var POSTGATE_COLLECTION = 'app.bsky.feed.postgate';
export function createPostgateRecord(postgate) {
    return {
        $type: POSTGATE_COLLECTION,
        createdAt: new Date().toISOString(),
        post: postgate.post,
        detachedEmbeddingUris: postgate.detachedEmbeddingUris || [],
        embeddingRules: postgate.embeddingRules || [],
    };
}
export function mergePostgateRecords(prev, next) {
    var detachedEmbeddingUris = Array.from(new Set(__spreadArray(__spreadArray([], (prev.detachedEmbeddingUris || []), true), (next.detachedEmbeddingUris || []), true)));
    var embeddingRules = __spreadArray(__spreadArray([], (prev.embeddingRules || []), true), (next.embeddingRules || []), true).filter(function (rule, i, all) { return all.findIndex(function (_rule) { return _rule.$type === rule.$type; }) === i; });
    return createPostgateRecord({
        post: prev.post,
        detachedEmbeddingUris: detachedEmbeddingUris,
        embeddingRules: embeddingRules,
    });
}
export function createEmbedViewDetachedRecord(_a) {
    var uri = _a.uri;
    var record = {
        $type: 'app.bsky.embed.record#viewDetached',
        uri: uri,
        detached: true,
    };
    return {
        $type: 'app.bsky.embed.record#view',
        record: record,
    };
}
export function createMaybeDetachedQuoteEmbed(_a) {
    var post = _a.post, quote = _a.quote, quoteUri = _a.quoteUri, detached = _a.detached;
    if (AppBskyEmbedRecord.isView(post.embed)) {
        if (detached) {
            return createEmbedViewDetachedRecord({ uri: quoteUri });
        }
        else {
            return createEmbedRecordView({ post: quote });
        }
    }
    else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
        if (detached) {
            return __assign(__assign({}, post.embed), { record: createEmbedViewDetachedRecord({ uri: quoteUri }) });
        }
        else {
            return createEmbedRecordWithMediaView({ post: post, quote: quote });
        }
    }
}
export function createEmbedViewRecordFromPost(post) {
    return {
        $type: 'app.bsky.embed.record#viewRecord',
        uri: post.uri,
        cid: post.cid,
        author: post.author,
        value: post.record,
        labels: post.labels,
        replyCount: post.replyCount,
        repostCount: post.repostCount,
        likeCount: post.likeCount,
        quoteCount: post.quoteCount,
        indexedAt: post.indexedAt,
        embeds: post.embed ? [post.embed] : [],
    };
}
export function createEmbedRecordView(_a) {
    var post = _a.post;
    return {
        $type: 'app.bsky.embed.record#view',
        record: createEmbedViewRecordFromPost(post),
    };
}
export function createEmbedRecordWithMediaView(_a) {
    var post = _a.post, quote = _a.quote;
    if (!AppBskyEmbedRecordWithMedia.isView(post.embed))
        return;
    return __assign(__assign({}, (post.embed || {})), { record: {
            record: createEmbedViewRecordFromPost(quote),
        } });
}
export function getMaybeDetachedQuoteEmbed(_a) {
    var viewerDid = _a.viewerDid, post = _a.post;
    if (AppBskyEmbedRecord.isView(post.embed)) {
        // detached
        if (AppBskyEmbedRecord.isViewDetached(post.embed.record)) {
            var urip = new AtUri(post.embed.record.uri);
            return {
                embed: post.embed,
                uri: urip.toString(),
                isOwnedByViewer: urip.host === viewerDid,
                isDetached: true,
            };
        }
        // post
        if (AppBskyEmbedRecord.isViewRecord(post.embed.record)) {
            var urip = new AtUri(post.embed.record.uri);
            return {
                embed: post.embed,
                uri: urip.toString(),
                isOwnedByViewer: urip.host === viewerDid,
                isDetached: false,
            };
        }
    }
    else if (AppBskyEmbedRecordWithMedia.isView(post.embed)) {
        // detached
        if (AppBskyEmbedRecord.isViewDetached(post.embed.record.record)) {
            var urip = new AtUri(post.embed.record.record.uri);
            return {
                embed: post.embed,
                uri: urip.toString(),
                isOwnedByViewer: urip.host === viewerDid,
                isDetached: true,
            };
        }
        // post
        if (AppBskyEmbedRecord.isViewRecord(post.embed.record.record)) {
            var urip = new AtUri(post.embed.record.record.uri);
            return {
                embed: post.embed,
                uri: urip.toString(),
                isOwnedByViewer: urip.host === viewerDid,
                isDetached: false,
            };
        }
    }
}
export var embeddingRules = {
    disableRule: { $type: 'app.bsky.feed.postgate#disableRule' },
};

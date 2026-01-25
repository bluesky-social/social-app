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
import { AtUri, moderatePost, } from '@atproto/api';
import { makeProfileLink } from '#/lib/routes/links';
export function threadPostNoUnauthenticated(_a) {
    var uri = _a.uri, depth = _a.depth, value = _a.value;
    return {
        type: 'threadPostNoUnauthenticated',
        key: uri,
        uri: uri,
        depth: depth,
        value: value,
        // @ts-ignore populated by the traversal
        ui: {},
    };
}
export function threadPostNotFound(_a) {
    var uri = _a.uri, depth = _a.depth, value = _a.value;
    return {
        type: 'threadPostNotFound',
        key: uri,
        uri: uri,
        depth: depth,
        value: value,
    };
}
export function threadPostBlocked(_a) {
    var uri = _a.uri, depth = _a.depth, value = _a.value;
    return {
        type: 'threadPostBlocked',
        key: uri,
        uri: uri,
        depth: depth,
        value: value,
    };
}
export function threadPost(_a) {
    var _b;
    var uri = _a.uri, depth = _a.depth, value = _a.value, moderationOpts = _a.moderationOpts, threadgateHiddenReplies = _a.threadgateHiddenReplies;
    var moderation = moderatePost(value.post, moderationOpts);
    var modui = moderation.ui('contentList');
    var blurred = modui.blur || modui.filter;
    var muted = ((_b = (modui.blurs[0] || modui.filters[0])) === null || _b === void 0 ? void 0 : _b.type) === 'muted';
    var hiddenByThreadgate = threadgateHiddenReplies.has(uri);
    var isOwnPost = value.post.author.did === moderationOpts.userDid;
    var isBlurred = (hiddenByThreadgate || blurred || muted) && !isOwnPost;
    return {
        type: 'threadPost',
        key: uri,
        uri: uri,
        depth: depth,
        value: __assign(__assign({}, value), { 
            /*
             * Do not spread anything here, load bearing for post shadow strict
             * equality reference checks.
             */
            post: value.post }),
        isBlurred: isBlurred,
        moderation: moderation,
        // @ts-ignore populated by the traversal
        ui: {},
    };
}
export function readMore(_a) {
    var depth = _a.depth, repliesUnhydrated = _a.repliesUnhydrated, skippedIndentIndices = _a.skippedIndentIndices, postData = _a.postData;
    var urip = new AtUri(postData.uri);
    var href = makeProfileLink({
        did: urip.host,
        handle: postData.authorHandle,
    }, 'post', urip.rkey);
    return {
        type: 'readMore',
        key: "readMore:".concat(postData.uri),
        href: href,
        moreReplies: repliesUnhydrated,
        depth: depth,
        skippedIndentIndices: skippedIndentIndices,
    };
}
export function readMoreUp(_a) {
    var postData = _a.postData;
    var urip = new AtUri(postData.uri);
    var href = makeProfileLink({
        did: urip.host,
        handle: postData.authorHandle,
    }, 'post', urip.rkey);
    return {
        type: 'readMoreUp',
        key: "readMoreUp:".concat(postData.uri),
        href: href,
    };
}
export function skeleton(_a) {
    var key = _a.key, item = _a.item;
    return {
        type: 'skeleton',
        key: key,
        item: item,
    };
}
export function postViewToThreadPlaceholder(post) {
    return {
        $type: 'app.bsky.unspecced.getPostThreadV2#threadItem',
        uri: post.uri,
        depth: 0, // reset to 0 for highlighted post
        value: {
            $type: 'app.bsky.unspecced.defs#threadItemPost',
            post: post,
            opThread: false,
            moreParents: false,
            moreReplies: 0,
            hiddenByThreadgate: false,
            mutedByViewer: false,
        },
    };
}

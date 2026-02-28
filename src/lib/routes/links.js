var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { AtUri } from '@atproto/api';
import { isInvalidHandle } from '#/lib/strings/handles';
export function makeProfileLink(info) {
    var segments = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        segments[_i - 1] = arguments[_i];
    }
    var handleSegment = info.did;
    if (info.handle && !isInvalidHandle(info.handle)) {
        handleSegment = info.handle;
    }
    return __spreadArray(["/profile", handleSegment], segments, true).join('/');
}
export function makeCustomFeedLink(did, rkey, segment, feedCacheKey) {
    return (__spreadArray(["/profile", did, 'feed', rkey], (segment ? [segment] : []), true).join('/') +
        (feedCacheKey ? "?feedCacheKey=".concat(encodeURIComponent(feedCacheKey)) : ''));
}
export function makeListLink(did, rkey) {
    var segments = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        segments[_i - 2] = arguments[_i];
    }
    return __spreadArray(["/profile", did, 'lists', rkey], segments, true).join('/');
}
export function makeTagLink(did) {
    return "/search?q=".concat(encodeURIComponent(did));
}
export function makeSearchLink(props) {
    return "/search?q=".concat(encodeURIComponent(props.query + (props.from ? " from:".concat(props.from) : '')));
}
export function makeStarterPackLink(starterPackOrName, rkey) {
    if (typeof starterPackOrName === 'string') {
        return "https://bsky.app/start/".concat(starterPackOrName, "/").concat(rkey);
    }
    else {
        var uriRkey = new AtUri(starterPackOrName.uri).rkey;
        return "https://bsky.app/start/".concat(starterPackOrName.creator.handle, "/").concat(uriRkey);
    }
}

var _a;
import { AtUri } from '@atproto/api';
import { BSKY_FEED_OWNER_DIDS } from '#/lib/constants';
import { IS_WEB } from '#/env';
var debugTopics = '';
if (IS_WEB && typeof window !== 'undefined') {
    var params = new URLSearchParams(window.location.search);
    debugTopics = (_a = params.get('debug_topics')) !== null && _a !== void 0 ? _a : '';
}
export function createBskyTopicsHeader(userInterests) {
    return {
        'X-Bsky-Topics': debugTopics || userInterests || '',
    };
}
export function aggregateUserInterests(preferences) {
    var _a, _b;
    return ((_b = (_a = preferences === null || preferences === void 0 ? void 0 : preferences.interests) === null || _a === void 0 ? void 0 : _a.tags) === null || _b === void 0 ? void 0 : _b.join(',')) || '';
}
export function isBlueskyOwnedFeed(feedUri) {
    var uri = new AtUri(feedUri);
    return BSKY_FEED_OWNER_DIDS.includes(uri.host);
}

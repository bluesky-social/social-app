import { Platform } from 'react-native';
import { BSKY_LABELER_DID } from '@atproto/api';
import { BLUESKY_PROXY_DID, CHAT_PROXY_DID } from '#/env';
export var LOCAL_DEV_SERVICE = Platform.OS === 'android' ? 'http://10.0.2.2:2583' : 'http://localhost:2583';
export var STAGING_SERVICE = 'https://staging.bsky.dev';
export var BSKY_SERVICE = 'https://bsky.social';
export var BSKY_SERVICE_DID = 'did:web:bsky.social';
export var PUBLIC_BSKY_SERVICE = 'https://public.api.bsky.app';
export var DEFAULT_SERVICE = BSKY_SERVICE;
var HELP_DESK_LANG = 'en-us';
export var HELP_DESK_URL = "https://blueskyweb.zendesk.com/hc/".concat(HELP_DESK_LANG);
export var EMBED_SERVICE = 'https://embed.bsky.app';
export var EMBED_SCRIPT = "".concat(EMBED_SERVICE, "/static/embed.js");
export var BSKY_DOWNLOAD_URL = 'https://bsky.app/download';
export var STARTER_PACK_MAX_SIZE = 150;
export var CARD_ASPECT_RATIO = 1200 / 630;
// HACK
// Yes, this is exactly what it looks like. It's a hard-coded constant
// reflecting the number of new users in the last week. We don't have
// time to add a route to the servers for this so we're just going to hard
// code and update this number with each release until we can get the
// server route done.
// -prf
export var JOINED_THIS_WEEK = 560000; // estimate as of 12/18/24
export var DISCOVER_DEBUG_DIDS = {
    'did:plc:oisofpd7lj26yvgiivf3lxsi': true, // hailey.at
    'did:plc:p2cp5gopk7mgjegy6wadk3ep': true, // samuel.bsky.team
    'did:plc:ragtjsm2j2vknwkz3zp4oxrd': true, // pfrazee.com
    'did:plc:vpkhqolt662uhesyj6nxm7ys': true, // why.bsky.team
    'did:plc:3jpt2mvvsumj2r7eqk4gzzjz': true, // esb.lol
    'did:plc:vjug55kidv6sye7ykr5faxxn': true, // emilyliu.me
    'did:plc:tgqseeot47ymot4zro244fj3': true, // iwsmith.bsky.social
    'did:plc:2dzyut5lxna5ljiaasgeuffz': true, // darrin.bsky.team
};
var BASE_FEEDBACK_FORM_URL = "".concat(HELP_DESK_URL, "/requests/new");
export function FEEDBACK_FORM_URL(_a) {
    var email = _a.email, handle = _a.handle;
    var str = BASE_FEEDBACK_FORM_URL;
    if (email) {
        str += "?tf_anonymous_requester_email=".concat(encodeURIComponent(email));
        if (handle) {
            str += "&tf_17205412673421=".concat(encodeURIComponent(handle));
        }
    }
    return str;
}
export var MAX_DISPLAY_NAME = 64;
export var MAX_DESCRIPTION = 256;
export var MAX_GRAPHEME_LENGTH = 300;
export var MAX_DM_GRAPHEME_LENGTH = 1000;
// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export var MAX_ALT_TEXT = 2000;
export var MAX_REPORT_REASON_GRAPHEME_LENGTH = 2000;
export function IS_TEST_USER(handle) {
    return handle && (handle === null || handle === void 0 ? void 0 : handle.endsWith('.test'));
}
export function IS_PROD_SERVICE(url) {
    return url && url !== STAGING_SERVICE && !url.startsWith(LOCAL_DEV_SERVICE);
}
export var PROD_DEFAULT_FEED = function (rkey) {
    return "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/".concat(rkey);
};
export var STAGING_DEFAULT_FEED = function (rkey) {
    return "at://did:plc:yofh3kx63drvfljkibw5zuxo/app.bsky.feed.generator/".concat(rkey);
};
export var PROD_FEEDS = [
    "feedgen|".concat(PROD_DEFAULT_FEED('whats-hot')),
    "feedgen|".concat(PROD_DEFAULT_FEED('thevids')),
];
export var STAGING_FEEDS = [
    "feedgen|".concat(STAGING_DEFAULT_FEED('whats-hot')),
    "feedgen|".concat(STAGING_DEFAULT_FEED('thevids')),
];
export var POST_IMG_MAX = {
    width: 2000,
    height: 2000,
    size: 1000000,
};
export var STAGING_LINK_META_PROXY = 'https://cardyb.staging.bsky.dev/v1/extract?url=';
export var PROD_LINK_META_PROXY = 'https://cardyb.bsky.app/v1/extract?url=';
export function LINK_META_PROXY(serviceUrl) {
    if (IS_PROD_SERVICE(serviceUrl)) {
        return PROD_LINK_META_PROXY;
    }
    return STAGING_LINK_META_PROXY;
}
export var STATUS_PAGE_URL = 'https://status.bsky.app/';
// Hitslop constants
export var createHitslop = function (size) { return ({
    top: size,
    left: size,
    bottom: size,
    right: size,
}); };
export var HITSLOP_10 = createHitslop(10);
export var HITSLOP_20 = createHitslop(20);
export var HITSLOP_30 = createHitslop(30);
export var LANG_DROPDOWN_HITSLOP = { top: 10, bottom: 10, left: 4, right: 4 };
export var BACK_HITSLOP = HITSLOP_30;
export var MAX_POST_LINES = 25;
export var BSKY_APP_ACCOUNT_DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';
export var BSKY_FEED_OWNER_DIDS = [
    BSKY_APP_ACCOUNT_DID,
    'did:plc:vpkhqolt662uhesyj6nxm7ys',
    'did:plc:q6gjnaw2blty4crticxkmujt',
];
export var DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';
export var VIDEO_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/thevids';
export var STAGING_VIDEO_FEED_URI = 'at://did:plc:yofh3kx63drvfljkibw5zuxo/app.bsky.feed.generator/thevids';
export var VIDEO_FEED_URIS = [VIDEO_FEED_URI, STAGING_VIDEO_FEED_URI];
export var DISCOVER_SAVED_FEED = {
    type: 'feed',
    value: DISCOVER_FEED_URI,
    pinned: true,
};
export var TIMELINE_SAVED_FEED = {
    type: 'timeline',
    value: 'following',
    pinned: true,
};
export var VIDEO_SAVED_FEED = {
    type: 'feed',
    value: VIDEO_FEED_URI,
    pinned: true,
};
export var RECOMMENDED_SAVED_FEEDS = [DISCOVER_SAVED_FEED, TIMELINE_SAVED_FEED];
export var KNOWN_SHUTDOWN_FEEDS = [
    'at://did:plc:wqowuobffl66jv3kpsvo7ak4/app.bsky.feed.generator/the-algorithm', // for you by skygaze
];
export var GIF_SERVICE = 'https://gifs.bsky.app';
export var GIF_SEARCH = function (params) {
    return "".concat(GIF_SERVICE, "/tenor/v2/search?").concat(params);
};
export var GIF_FEATURED = function (params) {
    return "".concat(GIF_SERVICE, "/tenor/v2/featured?").concat(params);
};
export var MAX_LABELERS = 20;
export var VIDEO_SERVICE = 'https://video.bsky.app';
export var VIDEO_SERVICE_DID = 'did:web:video.bsky.app';
export var VIDEO_MAX_DURATION_MS = 3 * 60 * 1000; // 3 minutes in milliseconds
/**
 * Maximum size of a video in megabytes, _not_ mebibytes. Backend uses
 * ISO megabytes.
 */
export var VIDEO_MAX_SIZE = 1000 * 1000 * 100; // 100mb
export var SUPPORTED_MIME_TYPES = [
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/quicktime',
    'image/gif',
];
export var EMOJI_REACTION_LIMIT = 5;
export var urls = {
    website: {
        blog: {
            findFriendsAnnouncement: 'https://bsky.social/about/blog/12-16-2025-find-friends',
            initialVerificationAnnouncement: "https://bsky.social/about/blog/04-21-2025-verification",
            searchTipsAndTricks: 'https://bsky.social/about/blog/05-31-2024-search',
        },
        support: {
            findFriendsPrivacyPolicy: 'https://bsky.social/about/support/find-friends-privacy-policy',
        },
    },
};
export var PUBLIC_APPVIEW = 'https://api.bsky.app';
export var PUBLIC_APPVIEW_DID = 'did:web:api.bsky.app';
export var PUBLIC_STAGING_APPVIEW_DID = 'did:web:api.staging.bsky.dev';
export var DEV_ENV_APPVIEW = "http://localhost:2584"; // always the same
export var DEV_ENV_APPVIEW_DID = "did:plc:dw4kbjf5mn7nhenabiqpkyh3"; // always the same
// temp hack for e2e - esb
export var BLUESKY_PROXY_HEADER = {
    value: "".concat(BLUESKY_PROXY_DID, "#bsky_appview"),
    get: function () {
        return this.value;
    },
    set: function (value) {
        this.value = value;
    },
};
export var DM_SERVICE_HEADERS = {
    'atproto-proxy': "".concat(CHAT_PROXY_DID, "#bsky_chat"),
};
export var BLUESKY_MOD_SERVICE_HEADERS = {
    'atproto-proxy': "".concat(BSKY_LABELER_DID, "#atproto_labeler"),
};
export var BLUESKY_NOTIF_SERVICE_HEADERS = {
    'atproto-proxy': "".concat(BLUESKY_PROXY_DID, "#bsky_notif"),
};
export var webLinks = {
    tos: "https://bsky.social/about/support/tos",
    privacy: "https://bsky.social/about/support/privacy-policy",
    community: "https://bsky.social/about/support/community-guidelines",
    communityDeprecated: "https://bsky.social/about/support/community-guidelines-deprecated",
};

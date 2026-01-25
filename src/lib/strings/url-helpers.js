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
import psl from 'psl';
import TLDs from 'tlds';
import { BSKY_SERVICE } from '#/lib/constants';
import { isInvalidHandle } from '#/lib/strings/handles';
import { startUriToStarterPackUri } from '#/lib/strings/starter-pack';
import { logger } from '#/logger';
export var BSKY_APP_HOST = 'https://bsky.app';
var BSKY_TRUSTED_HOSTS = __spreadArray([
    'bsky\\.app',
    'bsky\\.social',
    'blueskyweb\\.xyz',
    'blueskyweb\\.zendesk\\.com'
], (__DEV__ ? ['localhost:19006', 'localhost:8100'] : []), true);
/*
 * This will allow any BSKY_TRUSTED_HOSTS value by itself or with a subdomain.
 * It will also allow relative paths like /profile as well as #.
 */
var TRUSTED_REGEX = new RegExp("^(http(s)?://(([\\w-]+\\.)?".concat(BSKY_TRUSTED_HOSTS.join('|([\\w-]+\\.)?'), ")|/|#)"));
export function isValidDomain(str) {
    return !!TLDs.find(function (tld) {
        var i = str.lastIndexOf(tld);
        if (i === -1) {
            return false;
        }
        return str.charAt(i - 1) === '.' && i === str.length - tld.length;
    });
}
export function makeRecordUri(didOrName, collection, rkey) {
    var urip = new AtUri('at://placeholder.placeholder/');
    // @ts-expect-error TODO new-sdk-migration
    urip.host = didOrName;
    urip.collection = collection;
    urip.rkey = rkey;
    return urip.toString();
}
export function toNiceDomain(url) {
    try {
        var urlp = new URL(url);
        if ("https://".concat(urlp.host) === BSKY_SERVICE) {
            return 'Bluesky Social';
        }
        return urlp.host ? urlp.host : url;
    }
    catch (e) {
        return url;
    }
}
export function toShortUrl(url) {
    try {
        var urlp = new URL(url);
        if (urlp.protocol !== 'http:' && urlp.protocol !== 'https:') {
            return url;
        }
        var path = (urlp.pathname === '/' ? '' : urlp.pathname) + urlp.search + urlp.hash;
        if (path.length > 15) {
            return urlp.host + path.slice(0, 13) + '...';
        }
        return urlp.host + path;
    }
    catch (e) {
        return url;
    }
}
export function toShareUrl(url) {
    if (!url.startsWith('https')) {
        var urlp = new URL('https://bsky.app');
        urlp.pathname = url;
        url = urlp.toString();
    }
    return url;
}
export function toBskyAppUrl(url) {
    return new URL(url, BSKY_APP_HOST).toString();
}
export function isBskyAppUrl(url) {
    return url.startsWith('https://bsky.app/');
}
export function isRelativeUrl(url) {
    return /^\/[^/]/.test(url);
}
export function isBskyRSSUrl(url) {
    return ((url.startsWith('https://bsky.app/') || isRelativeUrl(url)) &&
        /\/rss\/?$/.test(url));
}
export function isExternalUrl(url) {
    var external = !isBskyAppUrl(url) && url.startsWith('http');
    var rss = isBskyRSSUrl(url);
    return external || rss;
}
export function isTrustedUrl(url) {
    return TRUSTED_REGEX.test(url);
}
export function isBskyPostUrl(url) {
    if (isBskyAppUrl(url)) {
        try {
            var urlp = new URL(url);
            return /profile\/(?<name>[^/]+)\/post\/(?<rkey>[^/]+)/i.test(urlp.pathname);
        }
        catch (_a) { }
    }
    return false;
}
export function isBskyCustomFeedUrl(url) {
    if (isBskyAppUrl(url)) {
        try {
            var urlp = new URL(url);
            return /profile\/(?<name>[^/]+)\/feed\/(?<rkey>[^/]+)/i.test(urlp.pathname);
        }
        catch (_a) { }
    }
    return false;
}
export function isBskyListUrl(url) {
    if (isBskyAppUrl(url)) {
        try {
            var urlp = new URL(url);
            return /profile\/(?<name>[^/]+)\/lists\/(?<rkey>[^/]+)/i.test(urlp.pathname);
        }
        catch (_a) {
            console.error('Unexpected error in isBskyListUrl()', url);
        }
    }
    return false;
}
export function isBskyStartUrl(url) {
    if (isBskyAppUrl(url)) {
        try {
            var urlp = new URL(url);
            return /start\/(?<name>[^/]+)\/(?<rkey>[^/]+)/i.test(urlp.pathname);
        }
        catch (_a) {
            console.error('Unexpected error in isBskyStartUrl()', url);
        }
    }
    return false;
}
export function isBskyStarterPackUrl(url) {
    if (isBskyAppUrl(url)) {
        try {
            var urlp = new URL(url);
            return /starter-pack\/(?<name>[^/]+)\/(?<rkey>[^/]+)/i.test(urlp.pathname);
        }
        catch (_a) {
            console.error('Unexpected error in isBskyStartUrl()', url);
        }
    }
    return false;
}
export function isBskyDownloadUrl(url) {
    if (isExternalUrl(url)) {
        return false;
    }
    return url === '/download' || url.startsWith('/download?');
}
export function convertBskyAppUrlIfNeeded(url) {
    if (isBskyAppUrl(url)) {
        try {
            var urlp = new URL(url);
            if (isBskyStartUrl(url)) {
                return startUriToStarterPackUri(urlp.pathname);
            }
            // special-case search links
            if (urlp.pathname === '/search') {
                return "/search?q=".concat(urlp.searchParams.get('q'));
            }
            return urlp.pathname;
        }
        catch (e) {
            console.error('Unexpected error in convertBskyAppUrlIfNeeded()', e);
        }
    }
    else if (isShortLink(url)) {
        // We only want to do this on native, web handles the 301 for us
        return shortLinkToHref(url);
    }
    return url;
}
export function listUriToHref(url) {
    try {
        var _a = new AtUri(url), hostname = _a.hostname, rkey = _a.rkey;
        return "/profile/".concat(hostname, "/lists/").concat(rkey);
    }
    catch (_b) {
        return '';
    }
}
export function feedUriToHref(url) {
    try {
        var _a = new AtUri(url), hostname = _a.hostname, rkey = _a.rkey;
        return "/profile/".concat(hostname, "/feed/").concat(rkey);
    }
    catch (_b) {
        return '';
    }
}
export function postUriToRelativePath(uri, options) {
    try {
        var _a = new AtUri(uri), hostname = _a.hostname, rkey = _a.rkey;
        var handleOrDid = (options === null || options === void 0 ? void 0 : options.handle) && !isInvalidHandle(options.handle)
            ? options.handle
            : hostname;
        return "/profile/".concat(handleOrDid, "/post/").concat(rkey);
    }
    catch (_b) {
        return undefined;
    }
}
/**
 * Checks if the label in the post text matches the host of the link facet.
 *
 * Hosts are case-insensitive, so should be lowercase for comparison.
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-3.2.2
 */
export function linkRequiresWarning(uri, label) {
    var labelDomain = labelToDomain(label);
    // We should trust any relative URL or a # since we know it links to internal content
    if (isRelativeUrl(uri) || uri === '#') {
        return false;
    }
    var urip;
    try {
        urip = new URL(uri);
    }
    catch (_a) {
        return true;
    }
    var host = urip.hostname.toLowerCase();
    if (isTrustedUrl(uri)) {
        // if this is a link to internal content, warn if it represents itself as a URL to another app
        return !!labelDomain && labelDomain !== host && isPossiblyAUrl(labelDomain);
    }
    else {
        // if this is a link to external content, warn if the label doesnt match the target
        if (!labelDomain) {
            return true;
        }
        return labelDomain !== host;
    }
}
/**
 * Returns a lowercase domain hostname if the label is a valid URL.
 *
 * Hosts are case-insensitive, so should be lowercase for comparison.
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-3.2.2
 */
export function labelToDomain(label) {
    // any spaces just immediately consider the label a non-url
    if (/\s/.test(label)) {
        return undefined;
    }
    try {
        return new URL(label).hostname.toLowerCase();
    }
    catch (_a) { }
    try {
        return new URL('https://' + label).hostname.toLowerCase();
    }
    catch (_b) { }
    return undefined;
}
export function isPossiblyAUrl(str) {
    str = str.trim();
    if (str.startsWith('http://')) {
        return true;
    }
    if (str.startsWith('https://')) {
        return true;
    }
    var firstWord = str.split(/[\s\/]/)[0];
    return isValidDomain(firstWord);
}
export function splitApexDomain(hostname) {
    var hostnamep = psl.parse(hostname);
    if (hostnamep.error || !hostnamep.listed || !hostnamep.domain) {
        return ['', hostname];
    }
    return [
        hostnamep.subdomain ? "".concat(hostnamep.subdomain, ".") : '',
        hostnamep.domain,
    ];
}
export function createBskyAppAbsoluteUrl(path) {
    var sanitizedPath = path.replace(BSKY_APP_HOST, '').replace(/^\/+/, '');
    return "".concat(BSKY_APP_HOST.replace(/\/$/, ''), "/").concat(sanitizedPath);
}
export function createProxiedUrl(url) {
    var u;
    try {
        u = new URL(url);
    }
    catch (_a) {
        return url;
    }
    if ((u === null || u === void 0 ? void 0 : u.protocol) !== 'http:' && (u === null || u === void 0 ? void 0 : u.protocol) !== 'https:') {
        return url;
    }
    return "https://go.bsky.app/redirect?u=".concat(encodeURIComponent(url));
}
export function isShortLink(url) {
    return url.startsWith('https://go.bsky.app/');
}
export function shortLinkToHref(url) {
    try {
        var urlp = new URL(url);
        // For now we only support starter packs, but in the future we should add additional paths to this check
        var parts = urlp.pathname.split('/').filter(Boolean);
        if (parts.length === 1) {
            return "/starter-pack-short/".concat(parts[0]);
        }
        return url;
    }
    catch (e) {
        logger.error('Failed to parse possible short link', { safeMessage: e });
        return url;
    }
}
export function getHostnameFromUrl(url) {
    var urlp;
    try {
        urlp = new URL(url);
    }
    catch (e) {
        return null;
    }
    return urlp.hostname;
}
export function getServiceAuthAudFromUrl(url) {
    var hostname = getHostnameFromUrl(url);
    if (!hostname) {
        return null;
    }
    return "did:web:".concat(hostname);
}
// passes URL.parse, and has a TLD etc
export function definitelyUrl(maybeUrl) {
    try {
        if (maybeUrl.endsWith('.'))
            return null;
        // Prepend 'https://' if the input doesn't start with a protocol
        if (!maybeUrl.startsWith('https://') && !maybeUrl.startsWith('http://')) {
            maybeUrl = 'https://' + maybeUrl;
        }
        var url = new URL(maybeUrl);
        // Extract the hostname and split it into labels
        var hostname = url.hostname;
        var labels = hostname.split('.');
        // Ensure there are at least two labels (e.g., 'example' and 'com')
        if (labels.length < 2)
            return null;
        var tld = labels[labels.length - 1];
        // Check that the TLD is at least two characters long and contains only letters
        if (!/^[a-z]{2,}$/i.test(tld))
            return null;
        return url.toString();
    }
    catch (_a) {
        return null;
    }
}

import { AtUri } from '@atproto/api';
export function createStarterPackLinkFromAndroidReferrer(referrerQueryString) {
    try {
        // The referrer string is just some URL parameters, so lets add them to a fake URL
        var url = new URL('http://throwaway.com/?' + referrerQueryString);
        var utmContent = url.searchParams.get('utm_content');
        var utmSource = url.searchParams.get('utm_source');
        if (!utmContent)
            return null;
        if (utmSource !== 'bluesky')
            return null;
        // This should be a string like `starterpack_haileyok.com_rkey`
        var contentParts = utmContent.split('_');
        if (contentParts[0] !== 'starterpack')
            return null;
        if (contentParts.length !== 3)
            return null;
        return "at://".concat(contentParts[1], "/app.bsky.graph.starterpack/").concat(contentParts[2]);
    }
    catch (e) {
        return null;
    }
}
export function parseStarterPackUri(uri) {
    if (!uri)
        return null;
    try {
        if (uri.startsWith('at://')) {
            var atUri = new AtUri(uri);
            if (atUri.collection !== 'app.bsky.graph.starterpack')
                return null;
            if (atUri.rkey) {
                return {
                    name: atUri.hostname,
                    rkey: atUri.rkey,
                };
            }
            return null;
        }
        else {
            var url = new URL(uri);
            var parts = url.pathname.split('/');
            var __ = parts[0], path = parts[1], name_1 = parts[2], rkey = parts[3];
            if (parts.length !== 4)
                return null;
            if (path !== 'starter-pack' && path !== 'start')
                return null;
            if (!name_1 || !rkey)
                return null;
            return {
                name: name_1,
                rkey: rkey,
            };
        }
    }
    catch (e) {
        return null;
    }
}
export function createStarterPackGooglePlayUri(name, rkey) {
    if (!name || !rkey)
        return null;
    return "https://play.google.com/store/apps/details?id=xyz.blueskyweb.app&referrer=utm_source%3Dbluesky%26utm_medium%3Dstarterpack%26utm_content%3Dstarterpack_".concat(name, "_").concat(rkey);
}
export function httpStarterPackUriToAtUri(httpUri) {
    if (!httpUri)
        return null;
    var parsed = parseStarterPackUri(httpUri);
    if (!parsed)
        return null;
    if (httpUri.startsWith('at://'))
        return httpUri;
    return "at://".concat(parsed.name, "/app.bsky.graph.starterpack/").concat(parsed.rkey);
}
export function getStarterPackOgCard(didOrStarterPack, rkey) {
    if (typeof didOrStarterPack === 'string') {
        return "https://ogcard.cdn.bsky.app/start/".concat(didOrStarterPack, "/").concat(rkey);
    }
    else {
        var rkey_1 = new AtUri(didOrStarterPack.uri).rkey;
        return "https://ogcard.cdn.bsky.app/start/".concat(didOrStarterPack.creator.did, "/").concat(rkey_1);
    }
}
export function createStarterPackUri(_a) {
    var did = _a.did, rkey = _a.rkey;
    return new AtUri("at://".concat(did, "/app.bsky.graph.starterpack/").concat(rkey)).toString();
}
export function startUriToStarterPackUri(uri) {
    return uri.replace('/start/', '/starter-pack/');
}

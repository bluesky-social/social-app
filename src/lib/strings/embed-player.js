import { Dimensions } from 'react-native';
import { IS_WEB, IS_WEB_SAFARI } from '#/env';
var SCREEN_HEIGHT = Dimensions.get('window').height;
var IFRAME_HOST = IS_WEB
    ? // @ts-ignore only for web
        window.location.host === 'localhost:8100'
            ? 'http://localhost:8100'
            : 'https://bsky.app'
    : __DEV__ && !process.env.JEST_WORKER_ID
        ? 'http://localhost:8100'
        : 'https://bsky.app';
export var embedPlayerSources = [
    'youtube',
    'youtubeShorts',
    'twitch',
    'spotify',
    'soundcloud',
    'appleMusic',
    'vimeo',
    'giphy',
    'tenor',
    'flickr',
];
export var externalEmbedLabels = {
    youtube: 'YouTube',
    youtubeShorts: 'YouTube Shorts',
    vimeo: 'Vimeo',
    twitch: 'Twitch',
    giphy: 'GIPHY',
    tenor: 'Tenor',
    spotify: 'Spotify',
    appleMusic: 'Apple Music',
    soundcloud: 'SoundCloud',
    flickr: 'Flickr',
};
var giphyRegex = /media(?:[0-4]\.giphy\.com|\.giphy\.com)/i;
var gifFilenameRegex = /^(\S+)\.(webp|gif|mp4)$/i;
export function parseEmbedPlayerFromUrl(url) {
    var _a, _b;
    var urlp;
    try {
        urlp = new URL(url);
    }
    catch (e) {
        return undefined;
    }
    // youtube
    if (urlp.hostname === 'youtu.be') {
        var videoId = urlp.pathname.split('/')[1];
        var t = (_a = urlp.searchParams.get('t')) !== null && _a !== void 0 ? _a : '0';
        var seek = encodeURIComponent(t.replace(/s$/, ''));
        if (videoId) {
            return {
                type: 'youtube_video',
                source: 'youtube',
                playerUri: "".concat(IFRAME_HOST, "/iframe/youtube.html?videoId=").concat(videoId, "&start=").concat(seek),
            };
        }
    }
    if (urlp.hostname === 'www.youtube.com' ||
        urlp.hostname === 'youtube.com' ||
        urlp.hostname === 'm.youtube.com' ||
        urlp.hostname === 'music.youtube.com') {
        var _c = urlp.pathname.split('/'), __ = _c[0], page = _c[1], shortOrLiveVideoId = _c[2];
        var isShorts = page === 'shorts';
        var isLive = page === 'live';
        var videoId = isShorts || isLive
            ? shortOrLiveVideoId
            : urlp.searchParams.get('v');
        var t = (_b = urlp.searchParams.get('t')) !== null && _b !== void 0 ? _b : '0';
        var seek = encodeURIComponent(t.replace(/s$/, ''));
        if (videoId) {
            return {
                type: isShorts ? 'youtube_short' : 'youtube_video',
                source: isShorts ? 'youtubeShorts' : 'youtube',
                hideDetails: isShorts ? true : undefined,
                playerUri: "".concat(IFRAME_HOST, "/iframe/youtube.html?videoId=").concat(videoId, "&start=").concat(seek),
            };
        }
    }
    // twitch
    if (urlp.hostname === 'twitch.tv' ||
        urlp.hostname === 'www.twitch.tv' ||
        urlp.hostname === 'm.twitch.tv') {
        var parent_1 = IS_WEB
            ? // @ts-ignore only for web
                window.location.hostname
            : 'localhost';
        var _d = urlp.pathname.split('/'), __ = _d[0], channelOrVideo = _d[1], clipOrId = _d[2], id = _d[3];
        if (channelOrVideo === 'videos') {
            return {
                type: 'twitch_video',
                source: 'twitch',
                playerUri: "https://player.twitch.tv/?volume=0.5&!muted&autoplay&video=".concat(clipOrId, "&parent=").concat(parent_1),
            };
        }
        else if (clipOrId === 'clip') {
            return {
                type: 'twitch_video',
                source: 'twitch',
                playerUri: "https://clips.twitch.tv/embed?volume=0.5&autoplay=true&clip=".concat(id, "&parent=").concat(parent_1),
            };
        }
        else if (channelOrVideo) {
            return {
                type: 'twitch_video',
                source: 'twitch',
                playerUri: "https://player.twitch.tv/?volume=0.5&!muted&autoplay&channel=".concat(channelOrVideo, "&parent=").concat(parent_1),
            };
        }
    }
    // spotify
    if (urlp.hostname === 'open.spotify.com') {
        var _e = urlp.pathname.split('/'), __ = _e[0], typeOrLocale = _e[1], idOrType = _e[2], id = _e[3];
        if (idOrType) {
            if (typeOrLocale === 'playlist' || idOrType === 'playlist') {
                return {
                    type: 'spotify_playlist',
                    source: 'spotify',
                    playerUri: "https://open.spotify.com/embed/playlist/".concat(id !== null && id !== void 0 ? id : idOrType),
                };
            }
            if (typeOrLocale === 'album' || idOrType === 'album') {
                return {
                    type: 'spotify_album',
                    source: 'spotify',
                    playerUri: "https://open.spotify.com/embed/album/".concat(id !== null && id !== void 0 ? id : idOrType),
                };
            }
            if (typeOrLocale === 'track' || idOrType === 'track') {
                return {
                    type: 'spotify_song',
                    source: 'spotify',
                    playerUri: "https://open.spotify.com/embed/track/".concat(id !== null && id !== void 0 ? id : idOrType),
                };
            }
            if (typeOrLocale === 'episode' || idOrType === 'episode') {
                return {
                    type: 'spotify_song',
                    source: 'spotify',
                    playerUri: "https://open.spotify.com/embed/episode/".concat(id !== null && id !== void 0 ? id : idOrType),
                };
            }
            if (typeOrLocale === 'show' || idOrType === 'show') {
                return {
                    type: 'spotify_song',
                    source: 'spotify',
                    playerUri: "https://open.spotify.com/embed/show/".concat(id !== null && id !== void 0 ? id : idOrType),
                };
            }
        }
    }
    // soundcloud
    if (urlp.hostname === 'soundcloud.com' ||
        urlp.hostname === 'www.soundcloud.com') {
        var _f = urlp.pathname.split('/'), __ = _f[0], user = _f[1], trackOrSets = _f[2], set = _f[3];
        if (user && trackOrSets) {
            if (trackOrSets === 'sets' && set) {
                return {
                    type: 'soundcloud_set',
                    source: 'soundcloud',
                    playerUri: "https://w.soundcloud.com/player/?url=".concat(url, "&auto_play=true&visual=false&hide_related=true"),
                };
            }
            return {
                type: 'soundcloud_track',
                source: 'soundcloud',
                playerUri: "https://w.soundcloud.com/player/?url=".concat(url, "&auto_play=true&visual=false&hide_related=true"),
            };
        }
    }
    if (urlp.hostname === 'music.apple.com' ||
        urlp.hostname === 'music.apple.com') {
        // This should always have: locale, type (playlist or album), name, and id. We won't use spread since we want
        // to check if the length is correct
        var pathParams = urlp.pathname.split('/');
        var type = pathParams[2];
        var songId = urlp.searchParams.get('i');
        if (pathParams.length === 5 &&
            (type === 'playlist' || type === 'album' || type === 'song')) {
            // We want to append the songId to the end of the url if it exists
            var embedUri = "https://embed.music.apple.com".concat(urlp.pathname).concat(songId ? "?i=".concat(songId) : '');
            if (type === 'playlist') {
                return {
                    type: 'apple_music_playlist',
                    source: 'appleMusic',
                    playerUri: embedUri,
                };
            }
            else if (type === 'album') {
                if (songId) {
                    return {
                        type: 'apple_music_song',
                        source: 'appleMusic',
                        playerUri: embedUri,
                    };
                }
                else {
                    return {
                        type: 'apple_music_album',
                        source: 'appleMusic',
                        playerUri: embedUri,
                    };
                }
            }
            else if (type === 'song') {
                return {
                    type: 'apple_music_song',
                    source: 'appleMusic',
                    playerUri: embedUri,
                };
            }
        }
    }
    if (urlp.hostname === 'vimeo.com' || urlp.hostname === 'www.vimeo.com') {
        var _g = urlp.pathname.split('/'), __ = _g[0], videoId = _g[1];
        if (videoId) {
            return {
                type: 'vimeo_video',
                source: 'vimeo',
                playerUri: "https://player.vimeo.com/video/".concat(videoId, "?autoplay=1"),
            };
        }
    }
    if (urlp.hostname === 'giphy.com' || urlp.hostname === 'www.giphy.com') {
        var _h = urlp.pathname.split('/'), __ = _h[0], gifs = _h[1], nameAndId = _h[2];
        /*
         * nameAndId is a string that consists of the name (dash separated) and the id of the gif (the last part of the name)
         * We want to get the id of the gif, then direct to media.giphy.com/media/{id}/giphy.webp so we can
         * use it in an <Image> component
         */
        if (gifs === 'gifs' && nameAndId) {
            var gifId = nameAndId.split('-').pop();
            if (gifId) {
                return {
                    type: 'giphy_gif',
                    source: 'giphy',
                    isGif: true,
                    hideDetails: true,
                    metaUri: "https://giphy.com/gifs/".concat(gifId),
                    playerUri: "https://i.giphy.com/media/".concat(gifId, "/200.webp"),
                };
            }
        }
    }
    // There are five possible hostnames that also can be giphy urls: media.giphy.com and media0-4.giphy.com
    // These can include (presumably) a tracking id in the path name, so we have to check for that as well
    if (giphyRegex.test(urlp.hostname)) {
        // We can link directly to the gif, if its a proper link
        var _j = urlp.pathname.split('/'), __ = _j[0], media = _j[1], trackingOrId = _j[2], idOrFilename = _j[3], filename = _j[4];
        if (media === 'media') {
            if (idOrFilename && gifFilenameRegex.test(idOrFilename)) {
                return {
                    type: 'giphy_gif',
                    source: 'giphy',
                    isGif: true,
                    hideDetails: true,
                    metaUri: "https://giphy.com/gifs/".concat(trackingOrId),
                    playerUri: "https://i.giphy.com/media/".concat(trackingOrId, "/200.webp"),
                };
            }
            else if (filename && gifFilenameRegex.test(filename)) {
                return {
                    type: 'giphy_gif',
                    source: 'giphy',
                    isGif: true,
                    hideDetails: true,
                    metaUri: "https://giphy.com/gifs/".concat(idOrFilename),
                    playerUri: "https://i.giphy.com/media/".concat(idOrFilename, "/200.webp"),
                };
            }
        }
    }
    // Finally, we should see if it is a link to i.giphy.com. These links don't necessarily end in .gif but can also
    // be .webp
    if (urlp.hostname === 'i.giphy.com' || urlp.hostname === 'www.i.giphy.com') {
        var _k = urlp.pathname.split('/'), __ = _k[0], mediaOrFilename = _k[1], filename = _k[2];
        if (mediaOrFilename === 'media' && filename) {
            var gifId = filename.split('.')[0];
            return {
                type: 'giphy_gif',
                source: 'giphy',
                isGif: true,
                hideDetails: true,
                metaUri: "https://giphy.com/gifs/".concat(gifId),
                playerUri: "https://i.giphy.com/media/".concat(gifId, "/200.webp"),
            };
        }
        else if (mediaOrFilename) {
            var gifId = mediaOrFilename.split('.')[0];
            return {
                type: 'giphy_gif',
                source: 'giphy',
                isGif: true,
                hideDetails: true,
                metaUri: "https://giphy.com/gifs/".concat(gifId),
                playerUri: "https://i.giphy.com/media/".concat(mediaOrFilename.split('.')[0], "/200.webp"),
            };
        }
    }
    var tenorGif = parseTenorGif(urlp);
    if (tenorGif.success) {
        var playerUri = tenorGif.playerUri, dimensions = tenorGif.dimensions;
        return {
            type: 'tenor_gif',
            source: 'tenor',
            isGif: true,
            hideDetails: true,
            playerUri: playerUri,
            dimensions: dimensions,
        };
    }
    // this is a standard flickr path! we can use the embedder for albums and groups, so validate the path
    if (urlp.hostname === 'www.flickr.com' || urlp.hostname === 'flickr.com') {
        var i = urlp.pathname.length - 1;
        while (i > 0 && urlp.pathname.charAt(i) === '/') {
            --i;
        }
        var path_components = urlp.pathname.slice(1, i + 1).split('/');
        if (path_components.length === 4) {
            // discard username - it's not relevant
            var photos = path_components[0], __ = path_components[1], albums = path_components[2], id = path_components[3];
            if (photos === 'photos' && albums === 'albums') {
                // this at least has the shape of a valid photo-album URL!
                return {
                    type: 'flickr_album',
                    source: 'flickr',
                    playerUri: "https://embedr.flickr.com/photosets/".concat(id),
                };
            }
        }
        if (path_components.length === 3) {
            var groups = path_components[0], id = path_components[1], pool = path_components[2];
            if (groups === 'groups' && pool === 'pool') {
                return {
                    type: 'flickr_album',
                    source: 'flickr',
                    playerUri: "https://embedr.flickr.com/groups/".concat(id),
                };
            }
        }
        // not an album or a group pool, don't know what to do with this!
        return undefined;
    }
    // link shortened flickr path
    if (urlp.hostname === 'flic.kr') {
        var b58alph = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
        var _l = urlp.pathname.split('/'), __ = _l[0], type = _l[1], idBase58Enc = _l[2];
        var id = 0n;
        for (var _i = 0, idBase58Enc_1 = idBase58Enc; _i < idBase58Enc_1.length; _i++) {
            var char = idBase58Enc_1[_i];
            var nextIdx = b58alph.indexOf(char);
            if (nextIdx >= 0) {
                id = id * 58n + BigInt(nextIdx);
            }
            else {
                // not b58 encoded, ergo not a valid link to embed
                return undefined;
            }
        }
        switch (type) {
            case 'go':
                var formattedGroupId = "".concat(id);
                return {
                    type: 'flickr_album',
                    source: 'flickr',
                    playerUri: "https://embedr.flickr.com/groups/".concat(formattedGroupId.slice(0, -2), "@N").concat(formattedGroupId.slice(-2)),
                };
            case 's':
                return {
                    type: 'flickr_album',
                    source: 'flickr',
                    playerUri: "https://embedr.flickr.com/photosets/".concat(id),
                };
            default:
                // we don't know what this is so we can't embed it
                return undefined;
        }
    }
}
export function getPlayerAspect(_a) {
    var type = _a.type, hasThumb = _a.hasThumb, width = _a.width;
    if (!hasThumb)
        return { aspectRatio: 16 / 9 };
    switch (type) {
        case 'youtube_video':
        case 'twitch_video':
        case 'vimeo_video':
            return { aspectRatio: 16 / 9 };
        case 'youtube_short':
            if (SCREEN_HEIGHT < 600) {
                return { aspectRatio: (9 / 16) * 1.75 };
            }
            else {
                return { aspectRatio: (9 / 16) * 1.5 };
            }
        case 'spotify_album':
        case 'apple_music_album':
        case 'apple_music_playlist':
        case 'spotify_playlist':
        case 'soundcloud_set':
            return { height: 380 };
        case 'spotify_song':
            if (width <= 300) {
                return { height: 155 };
            }
            return { height: 232 };
        case 'soundcloud_track':
            return { height: 165 };
        case 'apple_music_song':
            return { height: 150 };
        default:
            return { aspectRatio: 16 / 9 };
    }
}
export function getGifDims(originalHeight, originalWidth, viewWidth) {
    var scaledHeight = (originalHeight / originalWidth) * viewWidth;
    return {
        height: scaledHeight > 250 ? 250 : scaledHeight,
        width: (250 / scaledHeight) * viewWidth,
    };
}
export function getGiphyMetaUri(url) {
    if (giphyRegex.test(url.hostname) || url.hostname === 'i.giphy.com') {
        var params = parseEmbedPlayerFromUrl(url.toString());
        if (params && params.type === 'giphy_gif') {
            return params.metaUri;
        }
    }
}
export function parseTenorGif(urlp) {
    if (urlp.hostname !== 'media.tenor.com') {
        return { success: false };
    }
    var _a = urlp.pathname.split('/'), __ = _a[0], id = _a[1], filename = _a[2];
    if (!id || !filename) {
        return { success: false };
    }
    if (!id.includes('AAAAC')) {
        return { success: false };
    }
    var h = urlp.searchParams.get('hh');
    var w = urlp.searchParams.get('ww');
    if (!h || !w) {
        return { success: false };
    }
    var dimensions = {
        height: Number(h),
        width: Number(w),
    };
    if (IS_WEB) {
        if (IS_WEB_SAFARI) {
            id = id.replace('AAAAC', 'AAAP1');
            filename = filename.replace('.gif', '.mp4');
        }
        else {
            id = id.replace('AAAAC', 'AAAP3');
            filename = filename.replace('.gif', '.webm');
        }
    }
    else {
        id = id.replace('AAAAC', 'AAAAM');
    }
    return {
        success: true,
        playerUri: "https://t.gifs.bsky.app/".concat(id, "/").concat(filename),
        dimensions: dimensions,
    };
}
export function isTenorGifUri(url) {
    try {
        return parseTenorGif(typeof url === 'string' ? new URL(url) : url).success;
    }
    catch (_a) {
        // Invalid URL
        return false;
    }
}

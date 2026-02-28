import { AtpAgent } from '@atproto/api';
import { VIDEO_SERVICE } from '#/lib/constants';
export var createVideoEndpointUrl = function (route, params) {
    var url = new URL(VIDEO_SERVICE);
    url.pathname = route;
    if (params) {
        for (var key in params) {
            url.searchParams.set(key, params[key]);
        }
    }
    return url.href;
};
export function createVideoAgent() {
    return new AtpAgent({
        service: VIDEO_SERVICE,
    });
}
export function mimeToExt(mimeType) {
    switch (mimeType) {
        case 'video/mp4':
            return 'mp4';
        case 'video/webm':
            return 'webm';
        case 'video/mpeg':
            return 'mpeg';
        case 'video/quicktime':
            return 'mov';
        case 'image/gif':
            return 'gif';
        default:
            throw new Error("Unsupported mime type: ".concat(mimeType));
    }
}
export function extToMime(ext) {
    switch (ext.toLowerCase()) {
        case 'mp4':
            return 'video/mp4';
        case 'webm':
            return 'video/webm';
        case 'mpeg':
            return 'video/mpeg';
        case 'mov':
            return 'video/quicktime';
        case 'gif':
            return 'image/gif';
        default:
            throw new Error("Unsupported file extension: ".concat(ext));
    }
}

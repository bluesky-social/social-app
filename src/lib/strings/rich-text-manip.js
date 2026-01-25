import { AppBskyRichtextFacet, UnicodeString } from '@atproto/api';
import { toShortUrl } from './url-helpers';
export function shortenLinks(rt) {
    var _a;
    if (!((_a = rt.facets) === null || _a === void 0 ? void 0 : _a.length)) {
        return rt;
    }
    rt = rt.clone();
    // enumerate the link facets
    if (rt.facets) {
        for (var _i = 0, _b = rt.facets; _i < _b.length; _i++) {
            var facet = _b[_i];
            var isLink = !!facet.features.find(AppBskyRichtextFacet.isLink);
            if (!isLink) {
                continue;
            }
            // extract and shorten the URL
            var _c = facet.index, byteStart = _c.byteStart, byteEnd = _c.byteEnd;
            var url = rt.unicodeText.slice(byteStart, byteEnd);
            var shortened = new UnicodeString(toShortUrl(url));
            // insert the shorten URL
            rt.insert(byteStart, shortened.utf16);
            // update the facet to cover the new shortened URL
            facet.index.byteStart = byteStart;
            facet.index.byteEnd = byteStart + shortened.length;
            // remove the old URL
            rt.delete(byteStart + shortened.length, byteEnd + shortened.length);
        }
    }
    return rt;
}
// filter out any mention facets that didn't map to a user
export function stripInvalidMentions(rt) {
    var _a, _b;
    if (!((_a = rt.facets) === null || _a === void 0 ? void 0 : _a.length)) {
        return rt;
    }
    rt = rt.clone();
    if (rt.facets) {
        rt.facets = (_b = rt.facets) === null || _b === void 0 ? void 0 : _b.filter(function (facet) {
            var mention = facet.features.find(AppBskyRichtextFacet.isMention);
            if (mention && !mention.did) {
                return false;
            }
            return true;
        });
    }
    return rt;
}

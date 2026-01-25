import { AppBskyRichtextFacet } from '@atproto/api';
import { linkRequiresWarning } from './url-helpers';
export function richTextToString(rt, loose) {
    var text = rt.text, facets = rt.facets;
    if (!(facets === null || facets === void 0 ? void 0 : facets.length)) {
        return text;
    }
    var result = '';
    for (var _i = 0, _a = rt.segments(); _i < _a.length; _i++) {
        var segment = _a[_i];
        var link = segment.link;
        if (link && AppBskyRichtextFacet.validateLink(link).success) {
            var href = link.uri;
            var text_1 = segment.text;
            var requiresWarning = linkRequiresWarning(href, text_1);
            result += !requiresWarning ? href : loose ? "[".concat(text_1, "](").concat(href, ")") : text_1;
        }
        else {
            result += segment.text;
        }
    }
    return result;
}

import { isValidDomain } from './url-helpers';
export function detectLinkables(text) {
    var _a, _b;
    var re = /((^|\s|\()@[a-z0-9.-]*)|((^|\s|\()https?:\/\/[\S]+)|((^|\s|\()(?<domain>[a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*)/gi;
    var segments = [];
    var match;
    var start = 0;
    while ((match = re.exec(text))) {
        var matchIndex = match.index;
        var matchValue = match[0];
        if (((_a = match.groups) === null || _a === void 0 ? void 0 : _a.domain) && !isValidDomain((_b = match.groups) === null || _b === void 0 ? void 0 : _b.domain)) {
            continue;
        }
        if (/\s|\(/.test(matchValue)) {
            // HACK
            // skip the starting space
            // we have to do this because RN doesnt support negative lookaheads
            // -prf
            matchIndex++;
            matchValue = matchValue.slice(1);
        }
        // strip ending punctuation
        if (/[.,;!?]$/.test(matchValue)) {
            matchValue = matchValue.slice(0, -1);
        }
        if (/[)]$/.test(matchValue) && !matchValue.includes('(')) {
            matchValue = matchValue.slice(0, -1);
        }
        if (start !== matchIndex) {
            segments.push(text.slice(start, matchIndex));
        }
        segments.push({ link: matchValue });
        start = matchIndex + matchValue.length;
    }
    if (start < text.length) {
        segments.push(text.slice(start));
    }
    return segments;
}

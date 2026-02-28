import { countGraphemes } from 'unicode-segmenter/grapheme';
import { shortenLinks } from './rich-text-manip';
export function enforceLen(str, len, ellipsis, mode) {
    if (ellipsis === void 0) { ellipsis = false; }
    if (mode === void 0) { mode = 'end'; }
    str = str || '';
    if (str.length > len) {
        if (ellipsis) {
            if (mode === 'end') {
                return str.slice(0, len) + '…';
            }
            else if (mode === 'middle') {
                var half = Math.floor(len / 2);
                return str.slice(0, half) + '…' + str.slice(-half);
            }
            else {
                // fallback
                return str.slice(0, len);
            }
        }
        else {
            return str.slice(0, len);
        }
    }
    return str;
}
export function isOverMaxGraphemeCount(_a) {
    var text = _a.text, maxCount = _a.maxCount;
    if (typeof text === 'string') {
        return countGraphemes(text) > maxCount;
    }
    else {
        return shortenLinks(text).graphemeLength > maxCount;
    }
}
export function countLines(str) {
    var _a, _b;
    if (!str)
        return 0;
    return (_b = (_a = str.match(/\n/g)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
}
// Augments search query with additional syntax like `from:me`
export function augmentSearchQuery(query, _a) {
    var did = _a.did;
    // Don't do anything if there's no DID
    if (!did) {
        return query;
    }
    // replace “smart quotes” with normal ones
    // iOS keyboard will add fancy unicode quotes, but only normal ones work
    query = query.replaceAll(/[“”]/g, '"');
    // We don't want to replace substrings that are being "quoted" because those
    // are exact string matches, so what we'll do here is to split them apart
    // Even-indexed strings are unquoted, odd-indexed strings are quoted
    var splits = query.split(/("(?:[^"\\]|\\.)*")/g);
    return splits
        .map(function (str, idx) {
        if (idx % 2 === 0) {
            return str.replaceAll(/(^|\s)from:me(\s|$)/g, "$1".concat(did, "$2"));
        }
        return str;
    })
        .join('');
}

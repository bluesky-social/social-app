// \u2705 = ✅
// \u2713 = ✓
// \u2714 = ✔
// \u2611 = ☑
var CHECK_MARKS_RE = /[\u2705\u2713\u2714\u2611]/gu;
var CONTROL_CHARS_RE = /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
var MULTIPLE_SPACES_RE = /[\s][\s\u200B]+/g;
export function sanitizeDisplayName(str, moderation) {
    if (moderation === null || moderation === void 0 ? void 0 : moderation.blur) {
        return '';
    }
    if (typeof str === 'string') {
        return str
            .replace(CHECK_MARKS_RE, '')
            .replace(CONTROL_CHARS_RE, '')
            .replace(MULTIPLE_SPACES_RE, ' ')
            .trim();
    }
    return '';
}
export function combinedDisplayName(_a) {
    var handle = _a.handle, displayName = _a.displayName;
    if (!handle) {
        return '';
    }
    return displayName
        ? "".concat(sanitizeDisplayName(displayName), " (@").concat(handle, ")")
        : "@".concat(handle);
}

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// Regex from the go implementation
// https://github.com/bluesky-social/indigo/blob/main/atproto/syntax/handle.go#L10
import { forceLTR } from '#/lib/strings/bidi';
var VALIDATE_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
export var MAX_SERVICE_HANDLE_LENGTH = 18;
export function makeValidHandle(str) {
    if (str.length > 20) {
        str = str.slice(0, 20);
    }
    str = str.toLowerCase();
    return str.replace(/^[^a-z0-9]+/g, '').replace(/[^a-z0-9-]/g, '');
}
export function createFullHandle(name, domain) {
    name = (name || '').replace(/[.]+$/, '');
    domain = (domain || '').replace(/^[.]+/, '');
    return "".concat(name, ".").concat(domain);
}
export function isInvalidHandle(handle) {
    return handle === 'handle.invalid';
}
export function sanitizeHandle(handle, prefix, forceLeftToRight) {
    if (prefix === void 0) { prefix = ''; }
    if (forceLeftToRight === void 0) { forceLeftToRight = true; }
    var lowercasedWithPrefix = "".concat(prefix).concat(handle.toLocaleLowerCase());
    return isInvalidHandle(handle)
        ? '⚠Invalid Handle'
        : forceLeftToRight
            ? forceLTR(lowercasedWithPrefix)
            : lowercasedWithPrefix;
}
// More checks from https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/index.ts#L72
export function validateServiceHandle(str, userDomain) {
    var fullHandle = createFullHandle(str, userDomain);
    var results = {
        handleChars: !str || (VALIDATE_REGEX.test(fullHandle) && !str.includes('.')),
        hyphenStartOrEnd: !str.startsWith('-') && !str.endsWith('-'),
        frontLengthNotTooShort: str.length >= 3,
        frontLengthNotTooLong: str.length <= MAX_SERVICE_HANDLE_LENGTH,
        totalLength: fullHandle.length <= 253,
    };
    return __assign(__assign({}, results), { overall: !Object.values(results).includes(false) });
}

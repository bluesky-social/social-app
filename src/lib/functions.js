var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export function choose(value, choices) {
    return choices[value];
}
export function dedupArray(arr) {
    var s = new Set(arr);
    return __spreadArray([], s, true);
}
/**
 * Taken from @tanstack/query-core utils.ts
 * Modified to support Date object comparisons
 *
 * This function returns `a` if `b` is deeply equal.
 * If not, it will replace any deeply equal children of `b` with those of `a`.
 * This can be used for structural sharing between JSON values for example.
 */
export function replaceEqualDeep(a, b) {
    if (a === b) {
        return a;
    }
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime() ? a : b;
    }
    var array = isPlainArray(a) && isPlainArray(b);
    if (array || (isPlainObject(a) && isPlainObject(b))) {
        var aItems = array ? a : Object.keys(a);
        var aSize = aItems.length;
        var bItems = array ? b : Object.keys(b);
        var bSize = bItems.length;
        var copy = array ? [] : {};
        var equalItems = 0;
        for (var i = 0; i < bSize; i++) {
            var key = array ? i : bItems[i];
            if (!array &&
                a[key] === undefined &&
                b[key] === undefined &&
                aItems.includes(key)) {
                copy[key] = undefined;
                equalItems++;
            }
            else {
                copy[key] = replaceEqualDeep(a[key], b[key]);
                if (copy[key] === a[key] && a[key] !== undefined) {
                    equalItems++;
                }
            }
        }
        return aSize === bSize && equalItems === aSize ? a : copy;
    }
    return b;
}
export function isPlainArray(value) {
    return Array.isArray(value) && value.length === Object.keys(value).length;
}
// Copied from: https://github.com/jonschlinkert/is-plain-object
export function isPlainObject(o) {
    if (!hasObjectPrototype(o)) {
        return false;
    }
    // If has no constructor
    var ctor = o.constructor;
    if (ctor === undefined) {
        return true;
    }
    // If has modified prototype
    var prot = ctor.prototype;
    if (!hasObjectPrototype(prot)) {
        return false;
    }
    // If constructor does not have an Object-specific method
    if (!prot.hasOwnProperty('isPrototypeOf')) {
        return false;
    }
    // Most likely a plain Object
    return true;
}
function hasObjectPrototype(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}

export function isObj(v) {
    return !!v && typeof v === 'object';
}
export function hasProp(data, prop) {
    return prop in data;
}
export function isStrArray(v) {
    return Array.isArray(v) && v.every(function (item) { return typeof item === 'string'; });
}

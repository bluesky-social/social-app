export function timeout(ms) {
    return new Promise(function (r) { return setTimeout(r, ms); });
}

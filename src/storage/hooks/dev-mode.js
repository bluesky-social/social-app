import { device, useStorage } from '#/storage';
export function useDevMode() {
    var _a = useStorage(device, ['devMode']), _b = _a[0], devMode = _b === void 0 ? false : _b, setDevMode = _a[1];
    return [devMode, setDevMode];
}
var cachedIsDevMode;
/**
 * Does not update when toggling dev mode on or off. This util simply retrieves
 * the value and caches in memory indefinitely. So after an update, you'll need
 * to reload the app so it can pull a fresh value from storage.
 */
export function isDevMode() {
    var _a;
    if (__DEV__)
        return true;
    if (cachedIsDevMode === undefined) {
        cachedIsDevMode = (_a = device.get(['devMode'])) !== null && _a !== void 0 ? _a : false;
    }
    return cachedIsDevMode;
}

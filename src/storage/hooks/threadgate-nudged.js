import { device, useStorage } from '#/storage';
export function useThreadgateNudged() {
    var _a = useStorage(device, [
        'threadgateNudged',
    ]), _b = _a[0], threadgateNudged = _b === void 0 ? false : _b, setThreadgateNudged = _a[1];
    return [threadgateNudged, setThreadgateNudged];
}

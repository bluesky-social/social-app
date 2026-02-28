import { device, useStorage } from '#/storage';
export function useDemoMode() {
    var _a = useStorage(device, ['demoMode']), _b = _a[0], demoMode = _b === void 0 ? false : _b, setDemoMode = _a[1];
    return [demoMode, setDemoMode];
}

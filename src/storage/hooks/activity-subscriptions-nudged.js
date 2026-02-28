import { device, useStorage } from '#/storage';
export function useActivitySubscriptionsNudged() {
    var _a = useStorage(device, ['activitySubscriptionsNudged']), _b = _a[0], activitySubscriptionsNudged = _b === void 0 ? false : _b, setActivitySubscriptionsNudged = _a[1];
    return [activitySubscriptionsNudged, setActivitySubscriptionsNudged];
}

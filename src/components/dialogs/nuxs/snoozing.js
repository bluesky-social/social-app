import { simpleAreDatesEqual } from '#/lib/strings/time';
import { device } from '#/storage';
export function snooze() {
    device.set(['lastNuxDialog'], new Date().toISOString());
}
export function unsnooze() {
    device.set(['lastNuxDialog'], undefined);
}
export function isSnoozed() {
    var lastNuxDialog = device.get(['lastNuxDialog']);
    if (!lastNuxDialog)
        return false;
    var last = new Date(lastNuxDialog);
    var now = new Date();
    // already snoozed today
    if (simpleAreDatesEqual(last, now)) {
        return true;
    }
    return false;
}

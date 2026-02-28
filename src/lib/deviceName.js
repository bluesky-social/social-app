import * as Device from 'expo-device';
import * as env from '#/env';
export var FALLBACK_ANDROID = 'Android';
export var FALLBACK_IOS = 'iOS';
export var FALLBACK_WEB = 'Web';
export function getDeviceName() {
    var deviceName = Device.deviceName;
    if (env.IS_ANDROID) {
        return deviceName || FALLBACK_ANDROID;
    }
    else if (env.IS_IOS) {
        return deviceName || FALLBACK_IOS;
    }
    else {
        return FALLBACK_WEB; // could append browser info here
    }
}

import * as Device from 'expo-device'

import * as env from '#/env'

export const FALLBACK_ANDROID = 'Android'
export const FALLBACK_IOS = 'iOS'
export const FALLBACK_WEB = 'Web'

export function getDeviceName(): string {
  const deviceName = Device.deviceName
  if (env.IS_ANDROID) {
    return deviceName || FALLBACK_ANDROID
  } else if (env.IS_IOS) {
    return deviceName || FALLBACK_IOS
  } else {
    return FALLBACK_WEB // could append browser info here
  }
}

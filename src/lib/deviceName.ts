import * as Device from 'expo-device'

import * as env from '#/env'

export function getDeviceName(): string {
  const deviceName = Device.deviceName
  if (env.IS_ANDROID) {
    return deviceName || 'Android'
  } else if (env.IS_IOS) {
    // we need an entitlement to get the real device name on iOS, so just
    // return a generic name for now
    return 'iOS'
  } else {
    return 'Web' // could append browser info here
  }
}

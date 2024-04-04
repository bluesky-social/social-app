import VersionNumber from 'react-native-version-number'

export const IS_DEV = process.env.EXPO_PUBLIC_ENV === 'development'
export const IS_TESTFLIGHT = process.env.EXPO_PUBLIC_ENV === 'testflight'

const UPDATES_CHANNEL = IS_TESTFLIGHT ? 'testflight' : 'production'
export const appVersion = `${VersionNumber.appVersion} (${
  VersionNumber.buildVersion
}, ${IS_DEV ? 'development' : UPDATES_CHANNEL})`

import {nativeApplicationVersion, nativeBuildVersion} from 'expo-application'

export const IS_TESTFLIGHT = process.env.EXPO_PUBLIC_ENV === 'testflight'
export const IS_INTERNAL = __DEV__ || IS_TESTFLIGHT

// This is the commit hash that the current bundle was made from. The user can see the commit hash in the app's settings
// along with the other version info. Useful for debugging/reporting.
export const BUNDLE_IDENTIFIER = process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER ?? ''

// This will always be in the format of YYMMDD, so that it always increases for each build. This should only be used
// for Statsig reporting and shouldn't be used to identify a specific bundle.
export const BUNDLE_DATE =
  IS_TESTFLIGHT || __DEV__ ? 0 : Number(process.env.EXPO_PUBLIC_BUNDLE_DATE)

export const appVersion = `${nativeApplicationVersion}.${nativeBuildVersion}`
export const bundleInfo = `${BUNDLE_IDENTIFIER} (${
  __DEV__ ? 'dev' : IS_TESTFLIGHT ? 'tf' : 'prod'
})`

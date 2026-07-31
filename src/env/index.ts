import {Platform} from 'react-native'
import {nativeBuildVersion} from 'expo-application'

import {BUNDLE_IDENTIFIER, IS_TESTFLIGHT, RELEASE_VERSION} from '#/env/common'

export * from '#/env/common'

/**
 * The major version number of the current iOS device (e.g. `26` for iOS 26.x),
 * or `0` on non-iOS platforms.
 *
 * Note: for some reason Platform.OS === 'ios' AND Platform.Version is undefined
 * in our CI unit tests -sfn
 */
export const IOS_MAJOR_VERSION: number =
  Platform.OS === 'ios' && typeof Platform.Version === 'string'
    ? parseInt(Platform.Version.split('.')[0], 10)
    : 0
/**
 * The Android API level of the current device (e.g. `23` for Android 6.0), or
 * `0` on non-Android platforms. Note this is the API level, not the marketing
 * version.
 */
export const ANDROID_API_LEVEL: number =
  Platform.OS === 'android' && typeof Platform.Version === 'number'
    ? Platform.Version
    : 0

/**
 * The semver version of the app, specified in our `package.json`.file. On
 * iOs/Android, the native build version is appended to the semver version, so
 * that it can be used to identify a specific build.
 */
export const APP_VERSION = `${RELEASE_VERSION}.${nativeBuildVersion}`

/**
 * The short commit hash and environment of the current bundle.
 */
export const APP_METADATA = `${BUNDLE_IDENTIFIER.slice(0, 7)} (${
  __DEV__ ? 'dev' : IS_TESTFLIGHT ? 'tf' : 'prod'
})`

/**
 * Platform detection
 */
export const IS_IOS: boolean = Platform.OS === 'ios'
export const IS_ANDROID: boolean = Platform.OS === 'android'
export const IS_NATIVE: boolean = true
export const IS_WEB: boolean = false

/**
 * Web-specific platform detection
 */
export const IS_WEB_TOUCH_DEVICE: boolean = true
export const IS_WEB_MOBILE: boolean = false
export const IS_WEB_MOBILE_IOS: boolean = false
export const IS_WEB_MOBILE_ANDROID: boolean = false
export const IS_WEB_SAFARI: boolean = false
export const IS_WEB_FIREFOX: boolean = false

/**
 * Misc
 */
export const IS_HIGH_DPI: boolean = true
// ideally we'd use isLiquidGlassAvailable() from expo-glass-effect but checking iOS version is good enough for now
export const IS_LIQUID_GLASS: boolean = IOS_MAJOR_VERSION >= 26
// So we can avoid attempting on-device translation when we know it's unsupported.
export const IS_TRANSLATION_SUPPORTED: boolean =
  (IS_IOS && IOS_MAJOR_VERSION >= 18) || (IS_ANDROID && ANDROID_API_LEVEL > 22)

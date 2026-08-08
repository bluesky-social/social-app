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
 * The minor version number of the current iOS device (e.g. `4` for iOS 16.4),
 * or `0` on non-iOS platforms. A missing minor segment is treated as `.0`,
 * since `Platform.Version` is not guaranteed to have more than one segment.
 */
export const IOS_MINOR_VERSION: number =
  Platform.OS === 'ios' && typeof Platform.Version === 'string'
    ? parseInt(Platform.Version.split('.')[1] ?? '0', 10) || 0
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
/*
 * True on iOS devices below the 16.4 deployment target, i.e. devices that will
 * stop receiving app updates, so we can warn these users ahead of the bump.
 *
 * Note that no iPhone is capped between 16.0 and 16.3 - the oldest hardware
 * supporting iOS 16 reaches 16.7.x - so every device already on iOS 16 can get
 * to 16.4 by updating. Devices on iOS 15 may or may not be able to, and we
 * deliberately don't try to tell those two groups apart (it would mean
 * maintaining a hardware allowlist, and `Device.modelId` reports the host arch
 * rather than the simulated device, so the branch would be untestable).
 */
export const IS_UNSUPPORTED_IOS: boolean =
  IS_IOS &&
  (IOS_MAJOR_VERSION < 16 ||
    (IOS_MAJOR_VERSION === 16 && IOS_MINOR_VERSION < 4))

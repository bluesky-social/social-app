import { Platform } from 'react-native';
import { nativeBuildVersion } from 'expo-application';
import { BUNDLE_IDENTIFIER, IS_TESTFLIGHT, RELEASE_VERSION } from '#/env/common';
export * from '#/env/common';
// for some reason Platform.OS === 'ios' AND Platform.Version is undefined in our CI unit tests -sfn
var iOSMajorVersion = Platform.OS === 'ios' && typeof Platform.Version === 'string'
    ? parseInt(Platform.Version.split('.')[0], 10)
    : 0;
/**
 * The semver version of the app, specified in our `package.json`.file. On
 * iOs/Android, the native build version is appended to the semver version, so
 * that it can be used to identify a specific build.
 */
export var APP_VERSION = "".concat(RELEASE_VERSION, ".").concat(nativeBuildVersion);
/**
 * The short commit hash and environment of the current bundle.
 */
export var APP_METADATA = "".concat(BUNDLE_IDENTIFIER.slice(0, 7), " (").concat(__DEV__ ? 'dev' : IS_TESTFLIGHT ? 'tf' : 'prod', ")");
/**
 * Platform detection
 */
export var IS_IOS = Platform.OS === 'ios';
export var IS_ANDROID = Platform.OS === 'android';
export var IS_NATIVE = true;
export var IS_WEB = false;
/**
 * Web-specific platform detection
 */
export var IS_WEB_TOUCH_DEVICE = true;
export var IS_WEB_MOBILE = false;
export var IS_WEB_MOBILE_IOS = false;
export var IS_WEB_MOBILE_ANDROID = false;
export var IS_WEB_SAFARI = false;
export var IS_WEB_FIREFOX = false;
/**
 * Misc
 */
export var IS_HIGH_DPI = true;
// ideally we'd use isLiquidGlassAvailable() from expo-glass-effect but checking iOS version is good enough for now
export var IS_LIQUID_GLASS = iOSMajorVersion >= 26;

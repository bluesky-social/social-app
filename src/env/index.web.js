var _a;
import { BUNDLE_IDENTIFIER, RELEASE_VERSION } from '#/env/common';
export * from '#/env/common';
/**
 * The semver version of the app, specified in our `package.json`.file. On
 * iOs/Android, the native build version is appended to the semver version, so
 * that it can be used to identify a specific build.
 */
export var APP_VERSION = RELEASE_VERSION;
/**
 * The short commit hash and environment of the current bundle.
 */
export var APP_METADATA = "".concat(BUNDLE_IDENTIFIER.slice(0, 7), " (").concat(__DEV__ ? 'dev' : 'prod', ")");
/**
 * Platform detection
 */
export var IS_IOS = false;
export var IS_ANDROID = false;
export var IS_NATIVE = false;
export var IS_WEB = true;
/**
 * Web-specific platform detection
 */
export var IS_WEB_TOUCH_DEVICE = window.matchMedia('(pointer: coarse)').matches;
export var IS_WEB_MOBILE = (_a = window.matchMedia('only screen and (max-width: 1300px)')) === null || _a === void 0 ? void 0 : _a.matches;
export var IS_WEB_MOBILE_IOS = /iPhone/.test(navigator.userAgent);
export var IS_WEB_MOBILE_ANDROID = /android/i.test(navigator.userAgent) && IS_WEB_TOUCH_DEVICE;
export var IS_WEB_SAFARI = /^((?!chrome|android).)*safari/i.test(
// https://stackoverflow.com/questions/7944460/detect-safari-browser
navigator.userAgent);
export var IS_WEB_FIREFOX = /firefox|fxios/i.test(navigator.userAgent);
/**
 * Misc
 */
export var IS_HIGH_DPI = window.matchMedia('(min-resolution: 2dppx)').matches;

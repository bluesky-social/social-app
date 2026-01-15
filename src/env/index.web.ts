import {BUNDLE_IDENTIFIER, RELEASE_VERSION} from '#/env/common'

export * from '#/env/common'

/**
 * The semver version of the app, specified in our `package.json`.file. On
 * iOs/Android, the native build version is appended to the semver version, so
 * that it can be used to identify a specific build.
 */
export const APP_VERSION = RELEASE_VERSION

/**
 * The short commit hash and environment of the current bundle.
 */
export const APP_METADATA = `${BUNDLE_IDENTIFIER.slice(0, 7)} (${__DEV__ ? 'dev' : 'prod'})`

/**
 * Platform detection
 */
export const IS_IOS: boolean = false
export const IS_ANDROID: boolean = false
export const IS_NATIVE: boolean = false
export const IS_WEB: boolean = true
// @ts-ignore we know window exists -prf
export const IS_WEB_MOBILE: boolean = global.window.matchMedia(
  'only screen and (max-width: 1300px)',
)?.matches
export const IS_WEB_MOBILE_IOS: boolean = /iPhone/.test(navigator.userAgent)

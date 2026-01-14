import {nativeBuildVersion} from 'expo-application'

import {BUNDLE_IDENTIFIER, IS_TESTFLIGHT, RELEASE_VERSION} from '#/env/common'

export * from '#/env/common'

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

import packageJson from '#/../package.json'
import {BUNDLE_IDENTIFIER} from '#/env/common'

export * from '#/env/common'

/**
 * The semver version of the app, specified in our `package.json`.file. On
 * iOs/Android, the native build version is appended to the semver version, so
 * that it can be used to identify a specific build.
 */
export const APP_VERSION = packageJson.version

/**
 * The short commit hash and environment of the current bundle.
 */
export const APP_METADATA = `${BUNDLE_IDENTIFIER} (${__DEV__ ? 'dev' : 'prod'})`

import {Did} from '@atproto/api'

/**
 * The env the app is running in e.g. development, testflight, production
 */
export const EXPO_PUBLIC_ENV = process.env.EXPO_PUBLIC_ENV

/**
 * Indicates whether the app is running in TestFlight mode
 */
export const IS_TESTFLIGHT = EXPO_PUBLIC_ENV === 'testflight'

/**
 * Indicates whether the app is __DEV__ or TestFlight
 */
export const IS_INTERNAL = __DEV__ || IS_TESTFLIGHT

/**
 * The commit hash that the current bundle was made from. The user can see the
 * commit hash in the app's settings along with the other version info. Useful
 * for debugging/reporting.
 */
export const BUNDLE_IDENTIFIER: string =
  process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER ?? ''

/**
 * This will always be in the format of YYMMDD, so that it always increases for
 * each build. This should only be used for Statsig reporting and shouldn't be
 * used to identify a specific bundle.
 */
export const BUNDLE_DATE: number = IS_INTERNAL
  ? 0
  : Number(process.env.EXPO_PUBLIC_BUNDLE_DATE)

/**
 * The DID of the appview service to proxy to. If undefined, use Bluesky's
 * default app view.
 */
export const APPVIEW_PROXY_DID: Did =
  process.env.EXPO_PUBLIC_APPVIEW_PROXY_DID || 'did:web:api.bsky.app'

/**
 * The appview service to proxy to, derived from the APPVIEW_PROXY_DID.
 * Otherwise defaults to Bluesky's default app view.
 */
export const PUBLIC_APPVIEW_SERVICE: string = APPVIEW_PROXY_DID
  ? 'https://' + APPVIEW_PROXY_DID.split(':')[2]
  : 'https://public.api.bsky.app'

/**
 * The log level for the app.
 */
export const LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'

/**
 * Currently unused. Enable debug for a subset of the debug logs.
 */
export const LOG_DEBUG: string = process.env.EXPO_PUBLIC_LOG_DEBUG || ''

/**
 * The DID of the chat service to proxy to. If undefined, chat should be
 * disabled.
 */
export const CHAT_DID: Did | undefined = process.env.EXPO_PUBLIC_CHAT_DID

/**
 * Bitdrift API key. If undefined, Bitdrift should be disabled.
 */
export const BITDRIFT_API_KEY: string | undefined =
  process.env.EXPO_PUBLIC_BITDRIFT_API_KEY

/**
 * Sentry API key. If undefined, Sentry should be disabled.
 */
export const SENTRY_API_KEY: string | undefined =
  process.env.EXPO_PUBLIC_SENTRY_API_KEY

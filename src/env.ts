export const IS_TEST = process.env.EXPO_PUBLIC_ENV === 'test'
export const IS_DEV = __DEV__
export const IS_PROD = !IS_DEV
export const LOG_DEBUG = process.env.EXPO_PUBLIC_LOG_DEBUG || ''
export const LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'

export const PLUS_SERVICE_URL = process.env.EXPO_PUBLIC_PLUS_SERVICE_URL
export const RC_GOOGLE_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_RC_GOOGLE_PUBLIC_KEY || ''
export const RC_APPLE_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_RC_APPLE_PUBLIC_KEY || ''

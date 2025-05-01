export const LOG_DEBUG = process.env.EXPO_PUBLIC_LOG_DEBUG || ''
export const LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'

export const ENV_PUBLIC_BSKY_SERVICE: string | undefined =
  process.env.EXPO_PUBLIC_PUBLIC_BSKY_SERVICE
export const ENV_APPVIEW_DID_PROXY: string | undefined =
  process.env.EXPO_PUBLIC_APPVIEW_DID_PROXY

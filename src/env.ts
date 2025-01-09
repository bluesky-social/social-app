export const LOG_DEBUG = process.env.EXPO_PUBLIC_LOG_DEBUG || ''
export const LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'

export const APPVIEW_PROXY = process.env.APPVIEW_PROXY || ''

console.log({APPVIEW_PROXY})

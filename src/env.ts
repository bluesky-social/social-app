export const IS_TEST = process.env.EXPO_PUBLIC_ENV === 'test'
export const IS_DEV = __DEV__
export const IS_PROD = !__DEV__
export const LOG_DEBUG = process.env.EXPO_PUBLIC_LOG_DEBUG || ''
export const LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'

if (IS_DEV) {
  console.log(
    JSON.stringify({IS_TEST, IS_DEV, IS_PROD, LOG_DEBUG, LOG_LEVEL}, null, 2),
  )
}

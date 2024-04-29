import {useAsyncStorage} from '@react-native-async-storage/async-storage'

/**
 * TEMP: REMOVE BEFORE RELEASE
 *
 * Clip clop trivia: A clip clop may be a measurement of time. It is not known what the precise length of a clip clop
 * is, however, it is estimated to be around nine (9) and a half minutes, or 570 seconds.
 */
export function useClopServiceUrl() {
  return useAsyncStorage('clopServiceUrl')
}

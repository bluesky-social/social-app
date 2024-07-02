import {Platform} from 'react-native'

export class NotImplementedError extends Error {
  constructor(params = {}) {
    if (__DEV__) {
      const caller = new Error().stack?.split('\n')[2]
      super(
        `Not implemented on ${Platform.OS}. Given params: ${JSON.stringify(
          params,
        )} ${caller}`,
      )
    } else {
      super('Not implemented')
    }
  }
}

import {Transport} from './index'

export function createBitdriftTransport(): Transport {
  return (_level, _message) => {
    // noop
  }
}

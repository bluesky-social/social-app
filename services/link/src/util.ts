import {randomBytes} from 'node:crypto'

import {toString} from 'uint8arrays'

// 40bit random id of 5-7 characters
export const randomId = () => {
  return toString(randomBytes(5), 'base58btc')
}

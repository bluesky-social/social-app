import {generateSecureRandom} from 'react-native-securerandom'
import crypto from 'msrcrypto'
import '@zxing/text-encoding' // TextEncoder / TextDecoder

export const whenWebCrypto = new Promise(async (resolve, reject) => {
  try {
    const bytes = await generateSecureRandom(48)
    crypto.initPrng(Array.from(bytes))

    // @ts-ignore global.window exists -prf
    if (!global.window.crypto) {
      // @ts-ignore global.window exists -prf
      global.window.crypto = crypto
    }
    resolve(true)
  } catch (e: any) {
    reject(e)
  }
})

export const webcrypto = crypto

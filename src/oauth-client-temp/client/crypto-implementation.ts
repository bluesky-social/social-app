import {Key} from '../jwk'

export type DigestAlgorithm = {
  name: 'sha256' | 'sha384' | 'sha512'
}

export type {Key}

export interface CryptoImplementation {
  createKey(algs: )
}

import {sha256} from 'js-sha256'

export const SESSION_INDEX_KEY = 'bsky.session.index.v1'

export function accountKeys(did: string) {
  // DIDs often fit SecureStore's key grammar, but did:web can be arbitrarily
  // long and include disallowed characters. One fixed derivation keeps the
  // storage layout uniform for every DID method.
  // `.create()` forces the library's portable implementation. Calling the
  // convenience function directly selects Node crypto under Jest, while the
  // app's `crypto` alias intentionally exposes only Web Crypto.
  const id = sha256.create().update(did).hex()
  const prefix = `bsky.session.${id}`
  return {
    descriptor: `${prefix}.descriptor`,
    refresh: `${prefix}.refresh`,
    access: `${prefix}.access`,
  }
}

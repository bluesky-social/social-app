import {sha256} from 'js-sha256'

/** Holds the commit index describing the stored set of accounts. */
export const SESSION_INDEX_KEY = 'bsky.session.index.v1'

/**
 * Holds a random per-install marker, cross-checked at boot against the copy in
 * device storage. The iOS keychain outlives an app uninstall while device
 * storage dies with the app container, so a mismatch means the stored sessions
 * belong to a previous install of the app.
 */
export const SESSION_INSTALL_KEY = 'bsky.session.install.v1'

type AccountKeys = {
  descriptor: string
  refresh: string
  access: string
}

const cache = new Map<string, AccountKeys>()

/**
 * The three storage keys owned by an account: its descriptor (the account
 * minus its tokens), its refresh token, and its access token.
 *
 * SecureStore enforces a key grammar of `[A-Za-z0-9._-]` and every did
 * contains at least one `:`, so dids cannot be keys. One fixed sha256
 * derivation keeps the layout uniform for every did method.
 *
 * `.create()` forces the library's portable implementation. The convenience
 * function eval-requires node crypto, which the jest setup mocks away.
 *
 * Memoized: these are derived for every account on every write.
 */
export function accountKeys(did: string): AccountKeys {
  const cached = cache.get(did)
  if (cached) return cached
  const id = sha256.create().update(did).hex()
  const prefix = `bsky.session.${id}`
  const keys: AccountKeys = {
    descriptor: `${prefix}.descriptor`,
    refresh: `${prefix}.refresh`,
    access: `${prefix}.access`,
  }
  cache.set(did, keys)
  return keys
}

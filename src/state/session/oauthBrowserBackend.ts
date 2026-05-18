/**
 * Eurosky fork: browser backing for the confidential prod OAuth client.
 *
 * The turnkey `BrowserOAuthClient` is public-only (it hardcodes
 * `keyset: undefined`), so the confidential path uses the base
 * `OAuthClient`, which needs an explicit `runtimeImplementation` +
 * `stateStore` + `sessionStore`. `@atproto/oauth-client-browser` does NOT
 * re-export its own runtime/db (its package `exports` map is `"."`-only),
 * so we reimplement the minimal pieces here using only public API. This is
 * preferable to deep dist imports: zero extra upstream merge surface, no
 * `exports`-map fragility.
 *
 * Security-critical: the DPoP key is a non-extractable WebCrypto key. It is
 * structured-cloned into IndexedDB as a `CryptoKeyPair` and rehydrated via
 * `WebcryptoKey.fromKeypair`. It is NEVER JSON/localStorage serialized -
 * that non-extractability is the token-theft resistance the whole design
 * relies on, so the stores must be IndexedDB-backed.
 */
import {type Key} from '@atproto/jwk'
import {WebcryptoKey} from '@atproto/jwk-webcrypto'
import {
  type RuntimeImplementation,
  type SessionStore,
  type StateStore,
} from '@atproto/oauth-client'

// -- Runtime -----------------------------------------------------------------

const requestLock: RuntimeImplementation['requestLock'] =
  typeof navigator !== 'undefined' && navigator.locks?.request
    ? (name, fn) =>
        navigator.locks.request(name, {mode: 'exclusive'}, async () => fn())
    : undefined

/**
 * Mirrors @atproto/oauth-client-browser's BrowserRuntimeImplementation using
 * only public API (`WebcryptoKey` from @atproto/jwk-webcrypto + WebCrypto).
 * `createKey` produces non-extractable keys (DPoP theft resistance).
 */
export function createEuroskyOAuthRuntime(): RuntimeImplementation {
  if (typeof crypto !== 'object' || !crypto?.subtle) {
    throw new Error(
      'WebCrypto with SubtleCrypto is required (load the page over HTTPS).',
    )
  }
  return {
    createKey: algs => WebcryptoKey.generate(algs),
    getRandomValues: len => crypto.getRandomValues(new Uint8Array(len)),
    async digest(data, {name}) {
      const buf = await crypto.subtle.digest(`SHA-${name.slice(3)}`, data)
      return new Uint8Array(buf)
    },
    requestLock,
  }
}

// -- IndexedDB key/value -----------------------------------------------------

const DB_NAME = '@eurosky/oauth'
const DB_VERSION = 1
const STORES = ['state', 'session'] as const
type StoreName = (typeof STORES)[number]

let dbPromise: Promise<IDBDatabase> | undefined

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = fn(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

// -- DPoP key (de)serialization ---------------------------------------------

type EncodedKey = {keyId: string; keyPair: CryptoKeyPair}

function encodeKey(key: Key): EncodedKey {
  if (!(key instanceof WebcryptoKey) || !key.kid) {
    throw new Error(
      'oauth: expected a WebcryptoKey with a kid for the DPoP key',
    )
  }
  return {keyId: key.kid, keyPair: key.cryptoKeyPair}
}

function decodeKey(encoded: EncodedKey): Promise<WebcryptoKey> {
  return WebcryptoKey.fromKeypair(encoded.keyPair, encoded.keyId)
}

/**
 * Generic IndexedDB-backed SimpleStore whose value carries a `dpopKey` Key
 * that must be encoded/decoded around the structured-clone boundary. All
 * other fields (tokenSet, iss, verifier, appState, authMethod) are plain
 * structured-cloneable data and pass through untouched.
 */
function createKeyStore<V extends {dpopKey: Key}>(store: StoreName) {
  return {
    async get(key: string): Promise<V | undefined> {
      const stored = await tx<
        (Omit<V, 'dpopKey'> & {dpopKey: EncodedKey}) | undefined
      >(store, 'readonly', s => s.get(key))
      if (!stored) return undefined
      const {dpopKey, ...rest} = stored
      return {...rest, dpopKey: await decodeKey(dpopKey)} as V
    },
    async set(key: string, value: V): Promise<void> {
      const {dpopKey, ...rest} = value
      const encoded = {...rest, dpopKey: encodeKey(dpopKey)}
      await tx(store, 'readwrite', s => s.put(encoded, key))
    },
    async del(key: string): Promise<void> {
      await tx(store, 'readwrite', s => s.delete(key))
    },
    async clear(): Promise<void> {
      await tx(store, 'readwrite', s => s.clear())
    },
  }
}

export function createOAuthStateStore(): StateStore {
  return createKeyStore<Parameters<StateStore['set']>[1]>('state')
}

export function createOAuthSessionStore(): SessionStore {
  return createKeyStore<Parameters<SessionStore['set']>[1]>('session')
}

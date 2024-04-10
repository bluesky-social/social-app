import {GenericStore, Value} from '@atproto/caching'
import {DidDocument} from '@atproto/did'
import {ResolvedHandle} from '@atproto/handle-resolver'
import {DB, DBObjectStore} from '@atproto/indexed-db'
import {Key} from '@atproto/jwk'
import {WebcryptoKey} from '@atproto/jwk-webcrypto'
import {InternalStateData, Session, TokenSet} from '@atproto/oauth-client'
import {OAuthServerMetadata} from '@atproto/oauth-server-metadata'

type Item<V> = {
  value: V
  expiresAt: null | Date
}

type EncodedKey = {
  keyId: string
  keyPair: CryptoKeyPair
}

function encodeKey(key: Key): EncodedKey {
  if (!(key instanceof WebcryptoKey) || !key.kid) {
    throw new Error('Invalid key object')
  }
  return {
    keyId: key.kid,
    keyPair: key.cryptoKeyPair,
  }
}

async function decodeKey(encoded: EncodedKey): Promise<Key> {
  return WebcryptoKey.fromKeypair(encoded.keyId, encoded.keyPair)
}

export type PopupStateData =
  | PromiseRejectedResult
  | PromiseFulfilledResult<string>

export type Schema = {
  popup: Item<PopupStateData>
  state: Item<{
    dpopKey: EncodedKey

    iss: string
    nonce: string
    verifier?: string
    appState?: string
  }>
  session: Item<{
    dpopKey: EncodedKey

    tokenSet: TokenSet
  }>

  didCache: Item<DidDocument>
  dpopNonceCache: Item<string>
  handleCache: Item<ResolvedHandle>
  metadataCache: Item<OAuthServerMetadata>
}

export type DatabaseStore<V extends Value> = GenericStore<string, V> & {
  getKeys: () => Promise<string[]>
}

const STORES = [
  'popup',
  'state',
  'session',

  'didCache',
  'dpopNonceCache',
  'handleCache',
  'metadataCache',
] as const

export class BrowserOAuthDatabase {
  #dbPromise = DB.open<Schema>(
    '@atproto-oauth-client',
    [
      db => {
        for (const name of STORES) {
          const store = db.createObjectStore(name)
          store.createIndex('expiresAt', 'expiresAt', {unique: false})
        }
      },
    ],
    {durability: 'strict'},
  )

  protected async run<N extends keyof Schema, R>(
    storeName: N,
    mode: 'readonly' | 'readwrite',
    fn: (s: DBObjectStore<Schema[N]>) => R | Promise<R>,
  ): Promise<R> {
    const db = await this.#dbPromise
    return await db.transaction([storeName], mode, tx =>
      fn(tx.objectStore(storeName)),
    )
  }

  protected createStore<N extends keyof Schema, V extends Value>(
    name: N,
    {
      encode,
      decode,
      maxAge,
    }: {
      encode: (value: V) => Schema[N]['value'] | PromiseLike<Schema[N]['value']>
      decode: (encoded: Schema[N]['value']) => V | PromiseLike<V>
      maxAge?: number
    },
  ): DatabaseStore<V> {
    return {
      get: async key => {
        // Find item in store
        const item = await this.run(name, 'readonly', dbStore => {
          return dbStore.get(key)
        })

        // Not found
        if (item === undefined) return undefined

        // Too old, proactively delete
        if (item.expiresAt != null && item.expiresAt < new Date()) {
          await this.run(name, 'readwrite', dbStore => {
            return dbStore.delete(key)
          })
          return undefined
        }

        // Item found and valid. Decode
        return decode(item.value)
      },

      getKeys: async () => {
        const keys = await this.run(name, 'readonly', dbStore => {
          return dbStore.getAllKeys()
        })
        return keys.filter(key => typeof key === 'string') as string[]
      },

      set: async (key, value) => {
        // Create encoded item record
        const item = {
          value: await encode(value),
          expiresAt: maxAge == null ? null : new Date(Date.now() + maxAge),
        } as Schema[N]

        // Store item record
        await this.run(name, 'readwrite', dbStore => {
          return dbStore.put(item, key)
        })
      },

      del: async key => {
        // Delete
        await this.run(name, 'readwrite', dbStore => {
          return dbStore.delete(key)
        })
      },
    }
  }

  getSessionStore(): DatabaseStore<Session> {
    return this.createStore('session', {
      encode: ({dpopKey, ...session}) => ({
        ...session,
        dpopKey: encodeKey(dpopKey),
      }),
      decode: async ({dpopKey, ...encoded}) => ({
        ...encoded,
        dpopKey: await decodeKey(dpopKey),
      }),
    })
  }

  getStateStore(): DatabaseStore<InternalStateData> {
    return this.createStore('state', {
      encode: ({dpopKey, ...session}) => ({
        ...session,
        dpopKey: encodeKey(dpopKey),
      }),
      decode: async ({dpopKey, ...encoded}) => ({
        ...encoded,
        dpopKey: await decodeKey(dpopKey),
      }),
    })
  }

  getPopupStore(): DatabaseStore<PopupStateData> {
    return this.createStore('popup', {
      encode: value => value,
      decode: encoded => encoded,
    })
  }

  getDpopNonceCache(): undefined | DatabaseStore<string> {
    return this.createStore('dpopNonceCache', {
      // No time limit. It is better to try with a potentially outdated nonce
      // and potentially succeed rather than make requests without a nonce and
      // 100% fail.
      encode: value => value,
      decode: encoded => encoded,
    })
  }

  getDidCache(): undefined | DatabaseStore<DidDocument> {
    return this.createStore('didCache', {
      maxAge: 60e3,
      encode: value => value,
      decode: encoded => encoded,
    })
  }

  getHandleCache(): undefined | DatabaseStore<ResolvedHandle> {
    return this.createStore('handleCache', {
      maxAge: 60e3,
      encode: value => value,
      decode: encoded => encoded,
    })
  }

  getMetadataCache(): undefined | DatabaseStore<OAuthServerMetadata> {
    return this.createStore('metadataCache', {
      maxAge: 60e3,
      encode: value => value,
      decode: encoded => encoded,
    })
  }

  async cleanup() {
    const db = await this.#dbPromise
    const query = IDBKeyRange.lowerBound(new Date())
    const res = await db.transaction(STORES, 'readonly', tx =>
      Promise.all(
        STORES.map(
          async storeName =>
            [
              storeName,
              await tx
                .objectStore(storeName)
                .index('expiresAt')
                .getAllKeys(query),
            ] as const,
        ),
      ),
    )

    const storesWithInvalidKeys = res.filter(r => r[1].length > 0)

    await db.transaction(
      storesWithInvalidKeys.map(r => r[0]),
      'readwrite',
      tx =>
        Promise.all(
          storesWithInvalidKeys.map(async ([name, keys]) =>
            tx.objectStore(name).delete(keys),
          ),
        ),
    )
  }

  async [Symbol.asyncDispose]() {
    // TODO: call cleanup at a constant interval ?
    await this.cleanup()

    const db = await this.#dbPromise
    await (db[Symbol.asyncDispose] || db[Symbol.dispose]).call(db)
  }
}

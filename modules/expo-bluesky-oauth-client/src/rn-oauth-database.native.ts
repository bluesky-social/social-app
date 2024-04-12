import {GenericStore, Value} from '@atproto/caching'
import {DidDocument} from '@atproto/did'
import {ResolvedHandle} from '@atproto/handle-resolver'
import {Key} from '@atproto/jwk'
import {WebcryptoKey} from '@atproto/jwk-webcrypto'
import {InternalStateData, Session, TokenSet} from '@atproto/oauth-client'
import {OAuthServerMetadata} from '@atproto/oauth-server-metadata'
import Storage from '@react-native-async-storage/async-storage'

type Item = {
  value: string
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

export type Schema = {
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
  'state',
  'session',

  'didCache',
  'dpopNonceCache',
  'handleCache',
  'metadataCache',
] as const

export class BrowserOAuthDatabase {
  async delete(key: string) {
    await Storage.removeItem(key)
  }

  protected createStore<N extends keyof Schema, V extends Value>(
    dbName: N,
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
        const itemJson = await Storage.getItem(`${dbName}.${key}`)
        if (itemJson == null) return undefined

        const item = JSON.parse(itemJson) as Schema[N]

        // Too old, proactively delete
        if (item.expiresAt != null && item.expiresAt < new Date()) {
          await this.delete(`${dbName}.${key}`)
          return undefined
        }

        // Item found and valid. Decode
        return decode(item.value)
      },

      getKeys: async () => {
        const keys = await Storage.getAllKeys()
        return keys.filter(key => key.startsWith(`${dbName}.`)) as string[]
      },

      set: async (key, value) => {
        const item = {
          value: await encode(value),
          expiresAt: maxAge == null ? null : new Date(Date.now() + maxAge),
        } as Schema[N]

        await Storage.setItem(`${dbName}.${key}`, JSON.stringify(item))
      },

      del: async key => {
        await this.delete(`${dbName}.${key}`)
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
    await Promise.all(
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
    await this.cleanup()
  }
}

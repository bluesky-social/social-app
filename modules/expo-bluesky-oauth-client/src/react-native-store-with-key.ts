import {GenericStore, Value} from '@atproto/caching'
import {Jwk} from '@atproto/jwk'

import {ReactNativeKey} from './react-native-key.js'
import {ReactNativeStore} from './react-native-store.js'

type ExposedValue = Value & {dpopKey: ReactNativeKey}
type StoredValue<V extends ExposedValue> = Omit<V, 'dpopKey'> & {
  dpopKey: Jwk
}

/**
 * Uses a {@link ReactNativeStore} to store values that contain a
 * {@link ReactNativeKey} as `dpopKey` property. This works by serializing the
 * {@link Key} to a JWK before storing it, and deserializing it back to a
 * {@link ReactNativeKey} when retrieving the value.
 */
export class ReactNativeStoreWithKey<V extends ExposedValue>
  implements GenericStore<string, V>
{
  internalStore: ReactNativeStore<StoredValue<V>>

  constructor(
    protected valueExpiresAt: (value: StoredValue<V>) => null | Date,
  ) {
    this.internalStore = new ReactNativeStore(valueExpiresAt)
  }

  async set(key: string, value: V): Promise<void> {
    const {dpopKey, ...rest} = value
    if (!dpopKey.privateJwk) throw new Error('dpopKey.privateJwk is required')
    await this.internalStore.set(key, {
      ...rest,
      dpopKey: dpopKey.privateJwk,
    })
  }

  async get(key: string): Promise<V | undefined> {
    const value = await this.internalStore.get(key)
    if (!value) return undefined

    return {
      ...value,
      dpopKey: new ReactNativeKey(value.dpopKey),
    } as V
  }

  async del(key: string): Promise<void> {
    await this.internalStore.del(key)
  }
}

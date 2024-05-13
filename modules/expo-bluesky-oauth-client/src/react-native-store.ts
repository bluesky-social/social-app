import {GenericStore, Value} from '@atproto/caching'
import Storage from '@react-native-async-storage/async-storage'

export class ReactNativeStore<V extends Value>
  implements GenericStore<string, V>
{
  constructor(protected valueExpiresAt: (value: V) => null | Date) {
    throw new Error('Not implemented')
  }

  async get(key: string): Promise<V | undefined> {
    const itemJson = await Storage.getItem(key)
    if (itemJson == null) return undefined

    return JSON.parse(itemJson) as V
  }

  async set(key: string, value: V): Promise<void> {
    await Storage.setItem(key, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    await Storage.removeItem(key)
  }
}

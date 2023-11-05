import AsyncStorage from '@react-native-async-storage/async-storage'

import {Device} from '#/storage/schemas'

/**
 * Generic storage class. DO NOT use this directly. Instead, use the exported
 * storage instances below.
 */
export class Storage<Scopes extends unknown[], Schema> {
  protected sep = ':'
  protected store: typeof AsyncStorage

  constructor() {
    this.store = AsyncStorage
  }

  /**
   * Store a value in storage based on scopes and/or keys
   *
   *   `set([key], value)`
   *   `set([scope, key], value)`
   */
  async set<Key extends keyof Schema>(
    scopes: [...Scopes, Key],
    data: Schema[Key],
  ): Promise<void> {
    // stored as `{ data: <value> }` structure to ease stringification
    await this.store.setItem(scopes.join(this.sep), JSON.stringify({data}))
  }

  /**
   * Get a value from storage based on scopes and/or keys
   *
   *   `get([key])`
   *   `get([scope, key])`
   */
  async get<Key extends keyof Schema>(
    scopes: [...Scopes, Key],
  ): Promise<Schema[Key] | undefined> {
    const res = await this.store.getItem(scopes.join(this.sep))
    if (!res) return undefined
    // parsed from storage structure `{ data: <value> }`
    return JSON.parse(res).data
  }

  /**
   * Remove a value from storage based on scopes and/or keys
   *
   *   `remove([key])`
   *   `remove([scope, key])`
   */
  async remove<Key extends keyof Schema>(scopes: [...Scopes, Key]) {
    await this.store.removeItem(scopes.join(this.sep))
  }

  /**
   * Remove many values from the same storage scope by keys
   *
   *   `removeMany([], [key])`
   *   `removeMany([scope], [key])`
   */
  async removeMany<Key extends keyof Schema>(scopes: [...Scopes], keys: Key[]) {
    await Promise.all(keys.map(key => this.remove([...scopes, key])))
  }
}

/**
 * Data that's specific to the device
 *
 *   `device.set(['colorScheme'], 'light')`
 */
export const device = new Storage<[], Device>()

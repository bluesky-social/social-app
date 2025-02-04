import {MMKV} from 'react-native-mmkv'
import {Did} from '@atproto/api'

import {Account, Device} from '#/storage/schema'

export * from '#/storage/schema'

/**
 * Generic storage class. DO NOT use this directly. Instead, use the exported
 * storage instances below.
 */
export class Storage<Scopes extends unknown[], Schema> {
  protected sep = ':'
  protected store: MMKV

  constructor({id}: {id: string}) {
    this.store = new MMKV({id})
  }

  /**
   * Store a value in storage based on scopes and/or keys
   *
   *   `set([key], value)`
   *   `set([scope, key], value)`
   */
  set<Key extends keyof Schema>(
    scopes: [...Scopes, Key],
    data: Schema[Key],
  ): void {
    // stored as `{ data: <value> }` structure to ease stringification
    this.store.set(scopes.join(this.sep), JSON.stringify({data}))
  }

  /**
   * Get a value from storage based on scopes and/or keys
   *
   *   `get([key])`
   *   `get([scope, key])`
   */
  get<Key extends keyof Schema>(
    scopes: [...Scopes, Key],
  ): Schema[Key] | undefined {
    const res = this.store.getString(scopes.join(this.sep))
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
  remove<Key extends keyof Schema>(scopes: [...Scopes, Key]) {
    this.store.delete(scopes.join(this.sep))
  }

  /**
   * Remove many values from the same storage scope by keys
   *
   *   `removeMany([], [key])`
   *   `removeMany([scope], [key])`
   */
  removeMany<Key extends keyof Schema>(scopes: [...Scopes], keys: Key[]) {
    keys.forEach(key => this.remove([...scopes, key]))
  }
}

/**
 * Device data that's specific to the device and does not vary based on account
 *
 *   `device.set([key], true)`
 */
export const device = new Storage<[], Device>({id: 'bsky_device'})

/**
 * Account data that's specific to the account on this device
 */
export const account = new Storage<[Did], Account>({id: 'bsky_account'})

if (__DEV__ && typeof window !== 'undefined') {
  // @ts-ignore
  window.bsky_storage = {
    device,
    account,
  }
}

import {create} from '#/storage/archive/db'
import {type DB} from '#/storage/archive/db/types'
import {type Device} from '#/storage/archive/schema'

export * from '#/storage/archive/schema'

/**
 * Generic archival storage class. DO NOT use this directly. Instead, use the
 * exported `Archive` instances below.
 */
export class Archive<Scopes extends unknown[], Schema> {
  protected sep = ':'
  protected store: DB

  constructor({id}: {id: string}) {
    this.store = create({id})
  }

  /**
   * Store a value in archival storage based on scopes and/or keys
   *
   *   `set([key], value)`
   *   `set([scope, key], value)`
   */
  async set<Key extends keyof Schema>(
    scopes: [...Scopes, Key],
    data: Schema[Key],
  ): Promise<void> {
    // stored as `{ data: <value> }` structure to ease stringification
    return this.store.set(scopes.join(this.sep), JSON.stringify({data}))
  }

  /**
   * Get a value from archival storage based on scopes and/or keys
   *
   *   `get([key])`
   *   `get([scope, key])`
   */
  async get<Key extends keyof Schema>(
    scopes: [...Scopes, Key],
  ): Promise<Schema[Key] | undefined> {
    const res = await this.store.get(scopes.join(this.sep))
    if (!res) return undefined
    // parsed from storage structure `{ data: <value> }`
    return JSON.parse(res).data
  }

  /**
   * Remove a value from archival storage based on scopes and/or keys
   *
   *   `remove([key])`
   *   `remove([scope, key])`
   */
  async remove<Key extends keyof Schema>(scopes: [...Scopes, Key]) {
    return this.store.delete(scopes.join(this.sep))
  }

  /**
   * Remove many values from the same archival storage scope by keys
   *
   *   `removeMany([], [key])`
   *   `removeMany([scope], [key])`
   */
  async removeMany<Key extends keyof Schema>(scopes: [...Scopes], keys: Key[]) {
    return Promise.all(keys.map(key => this.remove([...scopes, key])))
  }

  /**
   * For debugging purposes
   */
  async removeAll() {
    return this.store.clear()
  }
}

/**
 * Device data that's specific to the device and does not vary based on account
 *
 *   `device.set([key], true)`
 */
export const deviceArchive = new Archive<[], Device>({
  id: 'bsky_archive_device',
})

if (__DEV__ && typeof window !== 'undefined') {
  // @ts-expect-error - dev global
  window.bsky_archive = {
    deviceArchive,
  }
}

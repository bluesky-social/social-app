import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {Schema, defaultData} from '#/storage/schema'

/**
 * The key we use to store our data in local storage.
 *
 * This value exists in `src/state/index.ts` also, but that file loads every mobx
 * store too, so it's duplicated here so that tests run faster.
 */
export const ROOT_STATE_STORAGE_KEY = 'root'

/**
 * In memory cache of local storage data. Never export or reference this
 * directly.
 *
 * We set it to a default value so that if AsyncStorage entirely fails, the app
 * will continue to function entirely in memory.
 */
let data: Schema = defaultData

/**
 * Loads data from local storage into memory for synchronous access. This
 * should be called once at the root of the application.
 */
export async function init() {
  logger.debug(`storage initializing`)

  try {
    const raw = await AsyncStorage.getItem(ROOT_STATE_STORAGE_KEY)
    data = (raw ? JSON.parse(raw) : {}) as Schema
  } catch (e) {
    logger.error(`storage init() failed`)
  }
}

/**
 * Get a value from local storage. Returns `unknown` type to force us to
 * validate and cast to the types we expect.
 */
export function get<T extends keyof Schema>(key: T): unknown {
  logger.debug(`storage get(${key})`)
  return data[key]
}

/**
 * Set a value on local storage. When setting objects, you need to manually
 * merge in new values.
 */
export async function set<T extends keyof Schema>(key: T, value: Schema[T]) {
  logger.debug(`storage set(${key}, value)`)

  data[key] = value

  try {
    // TODO maybe debounce this in the future
    await AsyncStorage.setItem(ROOT_STATE_STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (err) {
    logger.error(`storage set(${key}, value) failed`)
    return false
  }
}

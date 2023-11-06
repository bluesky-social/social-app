import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {Schema, defaultData} from '#/storage/schema'

export const STORAGE_ROOT_KEY = 'root'

/**
 * In memory cache of local storage data. Never export or reference this
 * directly.
 *
 * We set it to a default value so that if AsyncStorage entirely fails, the app
 * will continue to function entirely in memory.
 */
let data: Schema = defaultData

export async function init() {
  logger.debug(`storage initializing`)

  try {
    const raw = await AsyncStorage.getItem(STORAGE_ROOT_KEY)
    data = (raw ? JSON.parse(raw) : {}) as Schema
  } catch (e) {
    logger.error(`storage init() failed`)
  }
}

export function get<T extends keyof Schema>(key: T): Schema[T] {
  logger.debug(`storage get(${key})`)
  return data[key]
}

export async function set<T extends keyof Schema>(key: T, value: Schema[T]) {
  logger.debug(`storage set(${key}, value)`)

  data[key] = value

  try {
    // TODO maybe debounce this in the future
    await AsyncStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(data))
    return true
  } catch (err) {
    logger.error(`storage set(${key}, value) failed`)
    return false
  }
}

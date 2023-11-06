import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {Schema, PropertyMap} from '#/storage/schema'

export const STORAGE_ROOT_KEY = 'root'

/**
 * In memory cache of local storage data. Never export or reference this
 * directly.
 */
let data: Schema | undefined

export async function init() {
  const raw = await AsyncStorage.getItem(STORAGE_ROOT_KEY)
  logger.debug(`storage initialized`)
  // TODO: Add try catch here etc, same in lib/storage.ts
  data = (raw ? JSON.parse(raw) : {}) as Schema
}

export function get<T extends keyof PropertyMap>(key: T): PropertyMap[T] {
  logger.debug(`storage get(${key})`)
  if (!data) {
    throw new Error(`Data is not initialized. Did you forget to call init()`)
  }
  return data[key]
}

export async function set<T extends keyof PropertyMap>(
  key: T,
  value: PropertyMap[T],
) {
  logger.debug(`storage set(${key}, value)`)
  if (!data) {
    throw new Error(`Data is not initialized. Did you forget to call init()`)
  }
  data[ley] = value

  // TODO: actual writing should probably be debounced
  try {
    await AsyncStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(data))
  } catch (err) {
    logger.error(`storage set(${keypath}, value) failed`)
  }
}

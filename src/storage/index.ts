import AsyncStorage from '@react-native-async-storage/async-storage'
import getObj from 'lodash.get'
import setObj from 'lodash.set'

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
  data = (raw ? JSON.parse(raw) : {}) as Schema
}

export function get<T extends keyof PropertyMap>(keypath: T): PropertyMap[T] {
  logger.debug(`storage get(${keypath})`)
  if (!data) {
    throw new Error(`Data is not initialized. Did you forget to call init()`)
  }
  return getObj(data, keypath)
}

export async function set<T extends keyof PropertyMap>(
  keypath: T,
  value: PropertyMap[T],
) {
  logger.debug(`storage set(${keypath}, value)`)
  if (!data) {
    throw new Error(`Data is not initialized. Did you forget to call init()`)
  }

  const prev = getObj(data, keypath)
  setObj(data, keypath, value)

  try {
    await AsyncStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(data))
  } catch (err) {
    logger.error(`storage set(${keypath}, value) failed`)
    setObj(data, keypath, prev)
  }
}

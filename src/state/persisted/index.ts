import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {defaults, Schema, schema} from '#/state/persisted/schema'
import {PersistedApi} from './types'

export type {PersistedAccount, Schema} from '#/state/persisted/schema'
export {defaults} from '#/state/persisted/schema'

const BSKY_STORAGE = 'BSKY_STORAGE'

let _state: Schema = defaults

export async function init() {
  const stored = await readFromStorage()
  if (!stored) {
    await writeToStorage(defaults)
  }
  _state = stored || defaults
}
init satisfies PersistedApi['init']

export function get<K extends keyof Schema>(key: K): Schema[K] {
  return _state[key]
}
get satisfies PersistedApi['get']

export async function write<K extends keyof Schema>(
  key: K,
  value: Schema[K],
): Promise<void> {
  _state[key] = value
  await writeToStorage(_state)
}
write satisfies PersistedApi['write']

export function onUpdate(_cb: () => void): () => void {
  return () => {}
}
onUpdate satisfies PersistedApi['onUpdate']

export async function clearStorage() {
  try {
    await AsyncStorage.removeItem(BSKY_STORAGE)
  } catch (e: any) {
    logger.error(`persisted store: failed to clear`, {message: e.toString()})
  }
}
clearStorage satisfies PersistedApi['clearStorage']

async function writeToStorage(value: Schema) {
  try {
    schema.parse(value)
    await AsyncStorage.setItem(BSKY_STORAGE, JSON.stringify(value))
  } catch (e) {
    logger.error(`persisted state: failed writing root state to storage`, {
      message: e,
    })
  }
}

async function readFromStorage(): Promise<Schema | undefined> {
  let objData
  try {
    const rawData = await AsyncStorage.getItem(BSKY_STORAGE)
    objData = rawData ? JSON.parse(rawData) : undefined
  } catch (e) {
    logger.error('persisted state: failed to load root state from storage', {
      message: e,
    })
  }

  // new user
  if (!objData) return undefined

  // existing user, validate
  const parsed = schema.safeParse(objData)

  if (parsed.success) {
    return objData
  } else {
    const errors =
      parsed.error?.errors?.map(e => ({
        code: e.code,
        // @ts-ignore exists on some types
        expected: e?.expected,
        path: e.path?.join('.'),
      })) || []
    logger.error(`persisted store: data failed validation on read`, {errors})
    return undefined
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {Schema, schema} from '#/state/persisted/schema'

const BSKY_STORAGE = 'BSKY_STORAGE'

export async function write(value: Schema) {
  schema.parse(value)
  await AsyncStorage.setItem(BSKY_STORAGE, JSON.stringify(value))
}

export async function read(): Promise<Schema | undefined> {
  const rawData = await AsyncStorage.getItem(BSKY_STORAGE)
  const objData = rawData ? JSON.parse(rawData) : undefined

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

export async function clear() {
  try {
    await AsyncStorage.removeItem(BSKY_STORAGE)
  } catch (e: any) {
    logger.error(`persisted store: failed to clear`, {message: e.toString()})
  }
}

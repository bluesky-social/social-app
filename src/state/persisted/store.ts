import AsyncStorage from '@react-native-async-storage/async-storage'

import {Schema} from '#/state/persisted/schema'

const BSKY_STORAGE = 'BSKY_STORAGE'

export async function write(data: Schema) {
  await AsyncStorage.setItem(BSKY_STORAGE, JSON.stringify(data))
}

export async function read(): Promise<Schema | undefined> {
  const rawData = await AsyncStorage.getItem(BSKY_STORAGE)
  return rawData ? JSON.parse(rawData) : undefined
}

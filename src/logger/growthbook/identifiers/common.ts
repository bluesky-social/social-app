import uuid from 'react-native-uuid'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {device} from '#/storage'

const LEGACY_STABLE_ID = 'STATSIG_LOCAL_STORAGE_STABLE_ID'

export async function getAndMigrateStableId() {
  const id = (await AsyncStorage.getItem(LEGACY_STABLE_ID)) || uuid.v4()
  device.set(['stableId'], id)
  return id
}

export function getStableId() {
  return device.get(['stableId'])
}

export function getStableIdOrThrow() {
  const id = device.get(['stableId'])
  if (!id) {
    throw new Error(`stableId is not set, call getAndMigrateStableId first`)
  }
  return id
}

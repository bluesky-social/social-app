import uuid from 'react-native-uuid'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {device} from '#/storage'

const LEGACY_STABLE_ID = 'STATSIG_LOCAL_STORAGE_STABLE_ID'

export async function getAndMigrateDeviceId() {
  const migrated = getDeviceId()
  if (migrated) return migrated
  const id = (await AsyncStorage.getItem(LEGACY_STABLE_ID)) || uuid.v4()
  device.set(['deviceId'], id)
  return id
}

export function getDeviceId() {
  return device.get(['deviceId'])
}

export function getDeviceIdOrThrow() {
  const id = device.get(['deviceId'])
  if (!id) {
    throw new Error(`deviceId is not set, call getAndMigrateDeviceId first`)
  }
  return id
}

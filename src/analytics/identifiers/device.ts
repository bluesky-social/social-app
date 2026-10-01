import uuid from 'react-native-uuid'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {device} from '#/storage'

const LEGACY_STABLE_ID = 'STATSIG_LOCAL_STORAGE_STABLE_ID'
let deviceId = device.get(['deviceId'])

export async function getAndMigrateDeviceId() {
  if (deviceId) return deviceId
  deviceId = (await AsyncStorage.getItem(LEGACY_STABLE_ID)) || uuid.v4()
  device.set(['deviceId'], deviceId)
  return deviceId
}

export function getDeviceId() {
  return deviceId
}

export function getDeviceIdOrThrow() {
  if (!deviceId) {
    throw new Error(`deviceId is not set, call getAndMigrateDeviceId first`)
  }
  return deviceId
}

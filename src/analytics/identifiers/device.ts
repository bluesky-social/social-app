import {useSyncExternalStore} from 'react'
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

function subscribeToDeviceId(onChange: () => void) {
  const sub = device.addOnValueChangedListener(['deviceId'], onChange)
  return () => sub.remove()
}

/**
 * Reads the device ID for use during render. The app awaits
 * `getAndMigrateDeviceId` before booting (see `setupDeviceId` in
 * `analytics/index.tsx`), so this is normally set on first read.
 *
 * Subscribing rather than reading storage directly means a late write - a
 * caller that mounts before the migration resolves - still propagates, instead
 * of leaving consumers pinned to `undefined` for the lifetime of the component.
 * `useSyncExternalStore` re-evaluates the snapshot every render, so there's no
 * gap between the initial read and the subscription.
 */
export function useDeviceId() {
  return useSyncExternalStore(subscribeToDeviceId, getDeviceId)
}

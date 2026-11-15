import {device} from '#/storage'

/**
 * Read through on web so other tabs' writes are visible immediately. MMKV's
 * listeners only cover local writes, not changes from another tab.
 */
export function readRawSessionRecord() {
  return device.getRaw(['analyticsSession'])
}

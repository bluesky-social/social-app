import {device} from '#/storage'

let cachedRaw: string | undefined
let needsRead = true

/*
 * MMKV synchronously notifies local writes, deletes, and clears. Keep this
 * listener for the module's lifetime so recovery works without React consumers.
 * Invalidate lazily rather than reading storage inside another writer's callback.
 */
device.addOnValueChangedListener(['analyticsSession'], () => {
  needsRead = true
})

/** Native reads stay in memory until the persisted session changes. */
export function readRawSessionRecord() {
  if (needsRead) {
    cachedRaw = device.getRaw(['analyticsSession'])
    needsRead = false
  }
  return cachedRaw
}

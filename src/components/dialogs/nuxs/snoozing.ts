import {IS_DEV} from '#/env'
import {device} from '#/storage'

const PROD_SNOOZE_SECONDS = 3 * 60 * 60 // 3 hours
const SNOOZE_SECONDS = IS_DEV ? 10 : PROD_SNOOZE_SECONDS

export function snooze() {
  device.set(['lastNuxDialog'], new Date().toISOString())
}

export function unsnooze() {
  device.set(['lastNuxDialog'], undefined)
}

export function isSnoozed() {
  const lastNuxDialog = device.get(['lastNuxDialog'])
  if (!lastNuxDialog) return false
  const last = new Date(lastNuxDialog)
  const now = new Date()
  return now.getTime() - last.getTime() < SNOOZE_SECONDS * 1000
}

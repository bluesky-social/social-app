import {IS_DEV} from '#/env'
import {account} from '#/storage'

/*
 * Short snooze in dev so the auto-open behavior can be exercised without
 * waiting a day.
 */
const SNOOZE_MS = IS_DEV ? 10_000 : 24 * 60 * 60 * 1000

/**
 * Snoozes the invalid handle dialog for this account. Dismissing the dialog
 * counts as snoozing; the profile header pill bypasses the snooze entirely.
 */
export function snooze(did: string) {
  account.set([did, 'invalidHandleDialogSnoozedAt'], new Date().toISOString())
}

export function isSnoozed(did: string): boolean {
  const snoozedAt = account.get([did, 'invalidHandleDialogSnoozedAt'])
  if (!snoozedAt) return false
  const ts = new Date(snoozedAt).getTime()
  if (Number.isNaN(ts)) return false
  return Date.now() - ts < SNOOZE_MS
}

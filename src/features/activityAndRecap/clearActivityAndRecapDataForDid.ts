/**
 * Account-removal cleanup hook for Activity & Recap (AC-A10).
 *
 * Called by `removeAccount` in `src/state/session/index.tsx` alongside
 * `clearAgeAssuranceDataForDid`. Thin wrapper around `storage.clearAllForDid`
 * so the session file only depends on a single exported function from the
 * feature module.
 */
import {clearAllForDid} from '#/features/activityAndRecap/storage'

export function clearActivityAndRecapDataForDid({did}: {did: string}): void {
  clearAllForDid(did)
}

/**
 * Reactive reader for the account-scoped StreakStore.
 *
 * Subscribes to the underlying MMKV key so consumers re-render when the
 * streak tracker writes a new value. Use this in the indicator and the
 * explainer dialog; do NOT use it for mutation — writes go through the
 * tracker / reducer path.
 */

import {useSession} from '#/state/session'
import {type StreakStore} from '#/features/activityAndRecap/types'
import {account, useStorage} from '#/storage'

export function useStreakStore(): StreakStore | undefined {
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''
  const [value] = useStorage<typeof account, 'streak'>(account, [did, 'streak'])
  return value
}

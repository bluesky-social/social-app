import {useSyncExternalStore} from 'react'

import {useThreadStore} from '#/components/ComposerV2/hooks/ThreadStoreContext'
import {type ThreadState} from '#/components/ComposerV2/store/types'

/**
 * Subscribe to the full thread state. Rerenders whenever any post changes.
 * For finer-grained subscriptions use `useThreadPost(id)`.
 */
export function useThreadState(): ThreadState {
  const store = useThreadStore()
  return useSyncExternalStore(store.subscribe, store.getState)
}

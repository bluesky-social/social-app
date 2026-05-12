import {useSyncExternalStore} from 'react'

import {useThreadStore} from '#/components/ComposerV2/hooks/ThreadStoreContext'
import {type ThreadPost} from '#/components/ComposerV2/store/types'

/**
 * Subscribe to a single post by id. Returns undefined if no such post
 * exists. Rerenders only when this specific post's reference changes -
 * unrelated post mutations don't propagate here because the store's
 * actions spread `{...post, ...}` only on the touched post.
 */
export function useThreadPost(postId: string): ThreadPost | undefined {
  const store = useThreadStore()
  return useSyncExternalStore(
    store.subscribe,
    () => store.getState().posts[postId],
  )
}

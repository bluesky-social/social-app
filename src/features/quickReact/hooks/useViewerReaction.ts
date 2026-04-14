/*
 * Per-post projection over the viewer's reactions map.
 */

import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useSession} from '#/state/session'
import {createViewerReactionsQueryKey} from '#/features/quickReact/queries/reactions'
import {readAccountReactions} from '#/features/quickReact/storage'
import {
  type ReactionEmoji,
  type ReactionsMap,
} from '#/features/quickReact/types'

export function useViewerReaction({postUri}: {postUri: string}): {
  emoji: ReactionEmoji | undefined
} {
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''

  const {data} = useQuery<ReactionsMap, Error, ReactionEmoji | undefined>({
    queryKey: createViewerReactionsQueryKey({did}),
    queryFn: async () => readAccountReactions(did),
    staleTime: STALE.INFINITY,
    enabled: !!did,
    select: map => map[postUri]?.emoji,
  })

  return {emoji: data}
}

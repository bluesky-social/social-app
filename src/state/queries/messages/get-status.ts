import {useQuery} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import {STALE} from '..'
import {createQueryKey} from '../util'

const chatActorStatusQueryKey = () =>
  createQueryKey('chat-actor-status', {}, {persistedVersion: 1})

export function useChatActorStatusQuery() {
  const client = useChatClient()

  return useQuery({
    gcTime: STALE.INFINITY,
    staleTime: STALE.SECONDS.FIFTEEN,
    queryKey: chatActorStatusQueryKey(),
    queryFn: async () => {
      return await client.call(chat.bsky.actor.getStatus)
    },
  })
}

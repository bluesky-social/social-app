import {useQuery} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import {STALE} from '..'
import {createQueryKey} from '../util'

const chatActorStatusQueryKey = () =>
  createQueryKey('chat-actor-status', {}, {persistedVersion: 1})

export function useChatActorStatusQuery() {
  const chatClient = useChatClient()

  return useQuery({
    gcTime: STALE.INFINITY,
    staleTime: STALE.SECONDS.FIFTEEN,
    queryKey: chatActorStatusQueryKey(),
    queryFn: async () => {
      const data = await chatClient.call(chat.bsky.actor.getStatus, {})

      return data
    },
  })
}

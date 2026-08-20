import {useQuery} from '@tanstack/react-query'

import {useChatClient, useSession} from '#/state/session'
import * as ChatBskyActorGetStatus from '#/lexicons/chat/bsky/actor/getStatus'
import {STALE} from '..'
import {createQueryKey} from '../util'

const chatActorStatusQueryKey = () =>
  createQueryKey('chat-actor-status', {}, {persistedVersion: 1})

export function useChatActorStatusQuery() {
  const client = useChatClient()
  const {hasSession} = useSession()

  return useQuery({
    gcTime: STALE.INFINITY,
    staleTime: STALE.SECONDS.FIFTEEN,
    queryKey: chatActorStatusQueryKey(),
    queryFn: async () => {
      return await client.call(ChatBskyActorGetStatus)
    },
    enabled: hasSession,
  })
}

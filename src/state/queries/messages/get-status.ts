import {useQuery} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useAgent} from '#/state/session'
import {STALE} from '..'
import {createQueryKey} from '../util'

const chatActorStatusQueryKey = () =>
  createQueryKey('chat-actor-status', {}, {persistedVersion: 1})

export function useChatActorStatusQuery() {
  const agent = useAgent()

  return useQuery({
    gcTime: STALE.INFINITY,
    staleTime: STALE.SECONDS.FIFTEEN,
    queryKey: chatActorStatusQueryKey(),
    queryFn: async () => {
      const {data} = await agent.chat.bsky.actor.getStatus(
        {},
        {headers: DM_SERVICE_HEADERS},
      )

      return data
    },
  })
}

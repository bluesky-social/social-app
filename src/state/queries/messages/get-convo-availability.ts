import {type DidString} from '@atproto/syntax'
import {useQuery} from '@tanstack/react-query'

import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'
import {STALE} from '..'

const RQKEY_ROOT = 'convo-availability'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useGetConvoAvailabilityQuery(
  did: string,
  {enabled = true}: {enabled?: boolean} = {},
) {
  const chatClient = useChatClient()

  return useQuery({
    queryKey: RQKEY(did),
    queryFn: async () => {
      const data = await chatClient.call(chat.bsky.convo.getConvoAvailability, {
        members: [did as DidString],
      })

      return data
    },
    staleTime: STALE.INFINITY,
    enabled,
  })
}

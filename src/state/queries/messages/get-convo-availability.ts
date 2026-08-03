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
  const client = useChatClient()

  return useQuery({
    queryKey: RQKEY(did),
    queryFn: async () => {
      return await client.call(chat.bsky.convo.getConvoAvailability, {
        // callers pass an already-resolved actor did
        members: [did as DidString],
      })
    },
    staleTime: STALE.INFINITY,
    enabled,
  })
}

import {type DidString} from '@atproto/syntax'
import {useQuery} from '@tanstack/react-query'

import {useChatClient, useSession} from '#/state/session'
import * as ChatBskyConvoGetConvoAvailability from '#/lexicons/chat/bsky/convo/getConvoAvailability'
import {STALE} from '..'

const RQKEY_ROOT = 'convo-availability'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useGetConvoAvailabilityQuery(
  did: string,
  {enabled = true}: {enabled?: boolean} = {},
) {
  const client = useChatClient()
  const {hasSession} = useSession()

  return useQuery({
    queryKey: RQKEY(did),
    queryFn: async () => {
      return client.call(ChatBskyConvoGetConvoAvailability, {
        // callers pass an already-resolved actor did
        members: [did as DidString],
      })
    },
    staleTime: STALE.INFINITY,
    enabled: enabled && hasSession,
  })
}

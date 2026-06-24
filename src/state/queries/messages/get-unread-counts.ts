import {useQuery} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useAgent, useSession} from '#/state/session'
import {useAgeAssurance} from '#/ageAssurance'
import {STALE} from '..'

const RQKEY_ROOT = 'convo-unread-counts'
export const RQKEY = (includeGroupChats: boolean) =>
  [RQKEY_ROOT, includeGroupChats] as const
export const RQKEY_PARTIAL = [RQKEY_ROOT] as const

// the server sentinel-caps the badge counts: unreadAcceptedConvos maxes at 100
// (meaning "more than 99") and unreadRequestConvos at 11 (meaning "more than
// 10"). at the cap the value is no longer an exact count, so consumers must not
// treat it as one - both the optimistic decrement and the badge display ceiling
// key off these.
export const UNREAD_ACCEPTED_CAP = 100
export const UNREAD_REQUEST_CAP = 11

export function useUnreadCountsQuery() {
  const agent = useAgent()
  const {hasSession} = useSession()
  const aa = useAgeAssurance()
  const includeGroupChats = !aa.flags.groupChatDisabled

  return useQuery({
    queryKey: RQKEY(includeGroupChats),
    queryFn: async () => {
      const {data} = await agent.chat.bsky.convo.getUnreadCounts(
        {includeGroupChats},
        {headers: DM_SERVICE_HEADERS},
      )
      return data
    },
    staleTime: STALE.SECONDS.FIFTEEN,
    enabled: hasSession,
  })
}

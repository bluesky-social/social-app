import {useQuery} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {useAgent, useSession} from '#/state/session'
import {useAgeAssurance} from '#/ageAssurance'
import {STALE} from '..'

const RQKEY_ROOT = 'convo-unread-counts'
export const RQKEY = (includeGroupChats: boolean) =>
  [RQKEY_ROOT, includeGroupChats] as const
export const RQKEY_PARTIAL = [RQKEY_ROOT] as const

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

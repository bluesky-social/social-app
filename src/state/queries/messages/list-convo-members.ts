import {useQuery} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {RQKEY_ROOT as GET_CONVOS_KEY} from './conversation'

const RQKEY_SEGMENT = 'members'
export const RQKEY = (convoId: string) => [
  GET_CONVOS_KEY,
  convoId,
  RQKEY_SEGMENT,
]

// group chat size is 50, so should fetch the whole list in one go
const LIMIT = 50

export function useListConvoMembersQuery({convoId}: {convoId: string}) {
  const agent = useAgent()

  return useQuery({
    queryKey: RQKEY(convoId),
    queryFn: async () => {
      const members = []
      let cursor

      do {
        const {data} = await agent.chat.bsky.convo.getConvoMembers(
          {convoId, cursor, limit: LIMIT},
          {headers: DM_SERVICE_HEADERS},
        )
        members.push(...data.members)
        cursor = data.cursor
      } while (cursor)

      return members
    },
    staleTime: STALE.MINUTES.THIRTY,
  })
}

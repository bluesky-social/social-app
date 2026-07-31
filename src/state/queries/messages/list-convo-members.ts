import {type ChatBskyActorDefs} from '@atproto/api'
import {type QueryClient, useQuery} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'listConvoMembers'
export const listConvoMembersQueryKey = (convoId: string) =>
  createQueryKey(RQKEY_ROOT, {convoId})

// Group chat size is at least 50, so should fetch the whole list in one go
const LIMIT = 50

export function useListConvoMembersQuery({
  convoId,
  placeholderData,
}: {
  convoId: string
  placeholderData?: ChatBskyActorDefs.ProfileViewBasic[]
}) {
  const agent = useAgent()

  return useQuery({
    queryKey: listConvoMembersQueryKey(convoId),
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
    placeholderData,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<ChatBskyActorDefs.ProfileViewBasic, void> {
  const queryDatas = queryClient.getQueriesData<
    ChatBskyActorDefs.ProfileViewBasic[]
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) continue
    for (const member of queryData) {
      if (member.did === did) {
        yield member
      }
    }
  }
}

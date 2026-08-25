import {type QueryClient, useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useChatClient} from '#/state/session'
import {chat} from '#/lexicons'

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
  placeholderData?: chat.bsky.actor.defs.ProfileViewBasic[]
}) {
  const client = useChatClient()

  return useQuery({
    queryKey: listConvoMembersQueryKey(convoId),
    queryFn: async () => {
      /*
       * Both locals are annotated because the loop is self-referential: `data`
       * is inferred from a call whose params include `cursor`, so leaving
       * `cursor` to be inferred from `data.cursor` is circular. Annotating
       * `members` with the exported profile type also keeps the hook's result
       * type unchanged for consumers.
       */
      const members: chat.bsky.actor.defs.ProfileViewBasic[] = []
      let cursor: string | undefined

      do {
        const data = await client.call(chat.bsky.convo.getConvoMembers, {
          convoId,
          cursor,
          limit: LIMIT,
        })
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
): Generator<chat.bsky.actor.defs.ProfileViewBasic, void> {
  const queryDatas = queryClient.getQueriesData<
    chat.bsky.actor.defs.ProfileViewBasic[]
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

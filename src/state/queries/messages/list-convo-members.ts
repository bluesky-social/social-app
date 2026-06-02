import {
  type ChatBskyActorDefs,
  type ChatBskyConvoGetConvoMembers,
} from '@atproto/api'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {DM_SERVICE_HEADERS} from '#/lib/constants'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'listConvoMembers'
export const listConvoMembersQueryKey = (convoId: string) =>
  createQueryKey(RQKEY_ROOT, {convoId})

const LIMIT = 25

type Page = ChatBskyConvoGetConvoMembers.OutputSchema

export function useListConvoMembersQuery({
  convoId,
  placeholderData,
}: {
  convoId: string
  placeholderData?: ChatBskyActorDefs.ProfileViewBasic[]
}) {
  const agent = useAgent()

  return useInfiniteQuery<Page>({
    queryKey: listConvoMembersQueryKey(convoId),
    queryFn: async ({pageParam}) => {
      const {data} = await agent.chat.bsky.convo.getConvoMembers(
        {convoId, cursor: pageParam as string | undefined, limit: LIMIT},
        {headers: DM_SERVICE_HEADERS},
      )
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    staleTime: STALE.MINUTES.THIRTY,
    placeholderData: placeholderData
      ? {
          pages: [{members: placeholderData, cursor: undefined}],
          pageParams: [undefined],
        }
      : undefined,
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<ChatBskyActorDefs.ProfileViewBasic, void> {
  const queryDatas = queryClient.getQueriesData<InfiniteData<Page>>({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData) continue
    for (const page of queryData.pages) {
      for (const member of page.members) {
        if (member.did === did) {
          yield member
        }
      }
    }
  }
}

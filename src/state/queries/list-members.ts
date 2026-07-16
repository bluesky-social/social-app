import {type Client} from '@atproto/lex-client'
import {type AtUriString} from '@atproto/syntax'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

const PAGE_SIZE = 30
type RQPageParam = string | undefined

const RQKEY_ROOT = 'list-members'
const RQKEY_ROOT_ALL = 'list-members-all'
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri]
export const RQKEY_ALL = (uri: string) => [RQKEY_ROOT_ALL, uri]

export function useListMembersQuery(uri?: string, limit: number = PAGE_SIZE) {
  const client = useAppviewClient()
  return useInfiniteQuery<
    app.bsky.graph.getList.$OutputBody,
    Error,
    InfiniteData<app.bsky.graph.getList.$OutputBody>,
    QueryKey,
    RQPageParam
  >({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(uri ?? ''),
    async queryFn({pageParam}: {pageParam: RQPageParam}) {
      return await client.call(app.bsky.graph.getList, {
        list: uri! as AtUriString, // the enabled flag will prevent this from running until uri is set
        limit,
        cursor: pageParam,
      })
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    enabled: Boolean(uri),
  })
}

export function useAllListMembersQuery(uri?: string) {
  const client = useAppviewClient()
  return useQuery({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY_ALL(uri ?? ''),
    queryFn: async () => {
      return getAllListMembers(client, uri!)
    },
    enabled: Boolean(uri),
  })
}

export async function getAllListMembers(client: Client, uri: string) {
  let hasMore = true
  let cursor: string | undefined
  const listItems: app.bsky.graph.defs.ListItemView[] = []
  // We want to cap this at 6 pages, just for anything weird happening with the api
  let i = 0
  while (hasMore && i < 6) {
    const res = await client.call(app.bsky.graph.getList, {
      list: uri as AtUriString,
      limit: 50,
      cursor,
    })
    listItems.push(...res.items)
    hasMore = Boolean(res.cursor)
    cursor = res.cursor
    i++
  }
  return listItems
}

export async function invalidateListMembersQuery({
  queryClient,
  uri,
}: {
  queryClient: QueryClient
  uri: string
}) {
  await queryClient.invalidateQueries({queryKey: RQKEY(uri)})
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<app.bsky.actor.defs.ProfileView, void> {
  const queryDatas = queryClient.getQueriesData<
    InfiniteData<app.bsky.graph.getList.$OutputBody>
  >({
    queryKey: [RQKEY_ROOT],
  })
  for (const [_queryKey, queryData] of queryDatas) {
    if (!queryData?.pages) {
      continue
    }
    for (const page of queryData?.pages) {
      if (page.list.creator.did === did) {
        yield page.list.creator
      }
      for (const item of page.items) {
        if (item.subject.did === did) {
          yield item.subject
        }
      }
    }
  }

  const allQueryData = queryClient.getQueriesData<
    app.bsky.graph.defs.ListItemView[]
  >({
    queryKey: [RQKEY_ROOT_ALL],
  })
  for (const [_queryKey, queryData] of allQueryData) {
    if (!queryData) {
      continue
    }
    for (const item of queryData) {
      if (item.subject.did === did) {
        yield item.subject
      }
    }
  }
}

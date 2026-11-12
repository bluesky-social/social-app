import {type Client} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'
import {useInfiniteQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'

/** The most records `getAtmosphereRecordViews` takes. */
const MAX_URIS_PER_REQUEST = 25

const useActivityListQueryRoot = 'useActivityListQuery'

export type ActivityListPage = {
  items: {
    uri: AtUriString
    view: app.bsky.unspecced.getAtmosphereRecordViews.RecordView['view']
  }[]
  /** Offset into `uris` of the next page. */
  cursor: number | undefined
}

/**
 * One page of views for `uris`, starting at offset `start`. Views are
 * index-aligned with the requested records.
 */
export async function fetchActivityListPage(
  client: Client,
  uris: AtUriString[],
  start: number,
): Promise<ActivityListPage> {
  const end = start + MAX_URIS_PER_REQUEST
  const page = uris.slice(start, end)
  if (page.length === 0) return {items: [], cursor: undefined}
  const {views} = await client.call(
    app.bsky.unspecced.getAtmosphereRecordViews,
    {records: page.map(uri => ({uri}))},
  )
  return {
    items: page.map((uri, i) => ({uri, view: views[i]?.view})),
    cursor: end < uris.length ? end : undefined,
  }
}

/**
 * Hydrates a fixed list of records, a page at a time. The cursor is just an
 * offset into `uris`, like the notifications activity list.
 */
export function useActivityListQuery(uris: AtUriString[]) {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount?.did

  return useInfiniteQuery({
    queryKey: createQueryKey(useActivityListQueryRoot, {viewer, uris}),
    enabled: !!viewer,
    queryFn: ({pageParam}) => fetchActivityListPage(client, uris, pageParam),
    initialPageParam: 0,
    getNextPageParam: page => page.cursor,
    staleTime: STALE.MINUTES.ONE,
  })
}

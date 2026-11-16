import {type Client} from '@atproto/lex'
import {type AtUriString} from '@atproto/syntax'
import {type ModerationUI} from '@bsky/sdk/moderation'
import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query'

import {useApplyProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, useSession} from '#/state/session'
import {
  isActivityHidden,
  moderateActivity,
} from '#/screens/Atmosphere/ActivityTab/moderation'
import {
  type ActivityContent,
  toViewContent,
} from '#/screens/Atmosphere/ActivityTab/rows'
import {
  findProfiles,
  mapViewProfiles,
} from '#/screens/Atmosphere/data/mapProfiles'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'

/** The most records `getAtmosphereRecordViews` takes. */
const MAX_URIS_PER_REQUEST = 25

const useActivityListQueryRoot = 'useActivityListQuery'

type ActivityListPage = {
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

/** A card to render, or a warning when the record has no usable view. */
export type ActivityListItem =
  | {uri: AtUriString; content: ActivityContent; moderation: ModerationUI}
  | {uri: AtUriString; content: undefined}

/**
 * Hydrates a fixed list of records, a page at a time. The cursor is just an
 * offset into `uris`, like the notifications activity list. As with the
 * timeline, profile shadows and moderation apply in `select` over the raw
 * cached views.
 */
export function useActivityListQuery(uris: AtUriString[]) {
  const client = useAppviewClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount?.did
  const moderationOpts = useModerationOpts()
  const applyProfileShadow = useApplyProfileShadow()

  return useInfiniteQuery({
    queryKey: createQueryKey(useActivityListQueryRoot, {viewer, uris}),
    // Wait for moderation opts so hidden cards never flash in.
    enabled: !!viewer && !!moderationOpts,
    queryFn: ({pageParam}) => fetchActivityListPage(client, uris, pageParam),
    initialPageParam: 0,
    getNextPageParam: page => page.cursor,
    staleTime: STALE.MINUTES.ONE,
    select: data => ({
      pageParams: data.pageParams,
      pages: moderationOpts
        ? data.pages.map(page =>
            page.items.flatMap(({uri, view}): ActivityListItem[] => {
              const content = toViewContent(
                mapViewProfiles(view, applyProfileShadow),
              )
              if (!content) return [{uri, content}]
              const moderation = moderateActivity(
                content,
                undefined,
                moderationOpts,
              )
              return isActivityHidden(moderation)
                ? []
                : [{uri, content, moderation}]
            }),
          )
        : [],
    }),
  })
}

export function* findAllProfilesInQueryData(
  queryClient: QueryClient,
  did: string,
): Generator<bsky.profile.AnyProfileView, void> {
  const queryDatas = queryClient.getQueriesData<InfiniteData<ActivityListPage>>(
    {queryKey: [useActivityListQueryRoot]},
  )
  for (const [, data] of queryDatas) {
    for (const page of data?.pages ?? []) {
      for (const {view} of page.items) {
        yield* findProfiles(did, map => mapViewProfiles(view, map))
      }
    }
  }
}

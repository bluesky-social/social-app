import {useCallback, useEffect, useMemo, useRef} from 'react'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type AppBskyUnspeccedGetPopularFeedGenerators,
  AtUri,
  moderateFeedGenerator,
  RichText,
} from '@atproto/api'
import {
  type InfiniteData,
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {DISCOVER_FEED_URI, DISCOVER_SAVED_FEED} from '#/lib/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {STALE} from '#/state/queries'
import {RQKEY as listQueryKey} from '#/state/queries/list'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent, useSession} from '#/state/session'
import {router} from '#/routes'
import {useModerationOpts} from '../preferences/moderation-opts'
import {type FeedDescriptor} from './post-feed'
import {precacheResolvedUri} from './resolve-uri'

export type FeedSourceFeedInfo = {
  type: 'feed'
  view?: AppBskyFeedDefs.GeneratorView
  uri: string
  feedDescriptor: FeedDescriptor
  route: {
    href: string
    name: string
    params: Record<string, string>
  }
  cid: string
  avatar: string | undefined
  displayName: string
  description: RichText
  creatorDid: string
  creatorHandle: string
  likeCount: number | undefined
  likeUri: string | undefined
  contentMode: AppBskyFeedDefs.GeneratorView['contentMode']
}

export type FeedSourceListInfo = {
  type: 'list'
  view?: AppBskyGraphDefs.ListView
  uri: string
  feedDescriptor: FeedDescriptor
  route: {
    href: string
    name: string
    params: Record<string, string>
  }
  cid: string
  avatar: string | undefined
  displayName: string
  description: RichText
  creatorDid: string
  creatorHandle: string
  contentMode: undefined
}

export type FeedSourceInfo = FeedSourceFeedInfo | FeedSourceListInfo

const feedSourceInfoQueryKeyRoot = 'getFeedSourceInfo'
export const feedSourceInfoQueryKey = ({uri}: {uri: string}) => [
  feedSourceInfoQueryKeyRoot,
  uri,
]

const feedSourceNSIDs = {
  feed: 'app.bsky.feed.generator',
  list: 'app.bsky.graph.list',
}

export function hydrateFeedGenerator(
  view: AppBskyFeedDefs.GeneratorView,
): FeedSourceInfo {
  const urip = new AtUri(view.uri)
  const collection =
    urip.collection === 'app.bsky.feed.generator' ? 'feed' : 'lists'
  const href = `/profile/${urip.hostname}/${collection}/${urip.rkey}`
  const route = router.matchPath(href)

  return {
    type: 'feed',
    view,
    uri: view.uri,
    feedDescriptor: `feedgen|${view.uri}`,
    cid: view.cid,
    route: {
      href,
      name: route[0],
      params: route[1],
    },
    avatar: view.avatar,
    displayName: view.displayName
      ? sanitizeDisplayName(view.displayName)
      : `Feed by ${sanitizeHandle(view.creator.handle, '@')}`,
    description: new RichText({
      text: view.description || '',
      facets: (view.descriptionFacets || [])?.slice(),
    }),
    creatorDid: view.creator.did,
    creatorHandle: view.creator.handle,
    likeCount: view.likeCount,
    likeUri: view.viewer?.like,
    contentMode: view.contentMode,
  }
}

export function hydrateList(view: AppBskyGraphDefs.ListView): FeedSourceInfo {
  const urip = new AtUri(view.uri)
  const collection =
    urip.collection === 'app.bsky.feed.generator' ? 'feed' : 'lists'
  const href = `/profile/${urip.hostname}/${collection}/${urip.rkey}`
  const route = router.matchPath(href)

  return {
    type: 'list',
    view,
    uri: view.uri,
    feedDescriptor: `list|${view.uri}`,
    route: {
      href,
      name: route[0],
      params: route[1],
    },
    cid: view.cid,
    avatar: view.avatar,
    description: new RichText({
      text: view.description || '',
      facets: (view.descriptionFacets || [])?.slice(),
    }),
    creatorDid: view.creator.did,
    creatorHandle: view.creator.handle,
    displayName: view.name
      ? sanitizeDisplayName(view.name)
      : `User List by ${sanitizeHandle(view.creator.handle, '@')}`,
    contentMode: undefined,
  }
}

export function getFeedTypeFromUri(uri: string) {
  const {pathname} = new AtUri(uri)
  return pathname.includes(feedSourceNSIDs.feed) ? 'feed' : 'list'
}

export function getAvatarTypeFromUri(uri: string) {
  return getFeedTypeFromUri(uri) === 'feed' ? 'algo' : 'list'
}

export function useFeedSourceInfoQuery({uri}: {uri: string}) {
  const type = getFeedTypeFromUri(uri)
  const agent = useAgent()

  return useQuery({
    staleTime: STALE.INFINITY,
    queryKey: feedSourceInfoQueryKey({uri}),
    queryFn: async () => {
      let view: FeedSourceInfo

      if (type === 'feed') {
        const res = await agent.app.bsky.feed.getFeedGenerator({feed: uri})
        view = hydrateFeedGenerator(res.data.view)
      } else {
        const res = await agent.app.bsky.graph.getList({
          list: uri,
          limit: 1,
        })
        view = hydrateList(res.data.list)
      }

      return view
    },
  })
}

// HACK
// the protocol doesn't yet tell us which feeds are personalized
// this list is used to filter out feed recommendations from logged out users
// for the ones we know need it
// -prf
export const KNOWN_AUTHED_ONLY_FEEDS = [
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends', // popular with friends, by bsky.app
  'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/mutuals', // mutuals, by skyfeed
  'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/only-posts', // only posts, by skyfeed
  'at://did:plc:wzsilnxf24ehtmmc3gssy5bu/app.bsky.feed.generator/mentions', // mentions, by flicknow
  'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/bangers', // my bangers, by jaz
  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/mutuals', // mutuals, by bluesky
  'at://did:plc:q6gjnaw2blty4crticxkmujt/app.bsky.feed.generator/my-followers', // followers, by jaz
  'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/followpics', // the gram, by why
]

type GetPopularFeedsOptions = {limit?: number; enabled?: boolean}

export function createGetPopularFeedsQueryKey(
  options?: GetPopularFeedsOptions,
) {
  return ['getPopularFeeds', options?.limit]
}

export function useGetPopularFeedsQuery(options?: GetPopularFeedsOptions) {
  const {hasSession} = useSession()
  const agent = useAgent()
  const limit = options?.limit || 10
  const {data: preferences} = usePreferencesQuery()
  const queryClient = useQueryClient()
  const moderationOpts = useModerationOpts()

  // Make sure this doesn't invalidate unless really needed.
  const selectArgs = useMemo(
    () => ({
      hasSession,
      savedFeeds: preferences?.savedFeeds || [],
      moderationOpts,
    }),
    [hasSession, preferences?.savedFeeds, moderationOpts],
  )
  const lastPageCountRef = useRef(0)

  const query = useInfiniteQuery<
    AppBskyUnspeccedGetPopularFeedGenerators.OutputSchema,
    Error,
    InfiniteData<AppBskyUnspeccedGetPopularFeedGenerators.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    enabled: Boolean(moderationOpts) && options?.enabled !== false,
    queryKey: createGetPopularFeedsQueryKey(options),
    queryFn: async ({pageParam}) => {
      const res = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        limit,
        cursor: pageParam,
      })

      // precache feeds
      for (const feed of res.data.feeds) {
        const hydratedFeed = hydrateFeedGenerator(feed)
        precacheFeed(queryClient, hydratedFeed)
      }

      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    select: useCallback(
      (
        data: InfiniteData<AppBskyUnspeccedGetPopularFeedGenerators.OutputSchema>,
      ) => {
        const {
          savedFeeds,
          hasSession: hasSessionInner,
          moderationOpts,
        } = selectArgs
        return {
          ...data,
          pages: data.pages.map(page => {
            return {
              ...page,
              feeds: page.feeds.filter(feed => {
                if (
                  !hasSessionInner &&
                  KNOWN_AUTHED_ONLY_FEEDS.includes(feed.uri)
                ) {
                  return false
                }
                const alreadySaved = Boolean(
                  savedFeeds?.find(f => {
                    return f.value === feed.uri
                  }),
                )
                const decision = moderateFeedGenerator(feed, moderationOpts!)
                return !alreadySaved && !decision.ui('contentList').filter
              }),
            }
          }),
        }
      },
      [selectArgs /* Don't change. Everything needs to go into selectArgs. */],
    ),
  })

  useEffect(() => {
    const {isFetching, hasNextPage, data} = query
    if (isFetching || !hasNextPage) {
      return
    }

    // avoid double-fires of fetchNextPage()
    if (
      lastPageCountRef.current !== 0 &&
      lastPageCountRef.current === data?.pages?.length
    ) {
      return
    }

    // fetch next page if we haven't gotten a full page of content
    let count = 0
    for (const page of data?.pages || []) {
      count += page.feeds.length
    }
    if (count < limit && (data?.pages.length || 0) < 6) {
      query.fetchNextPage()
      lastPageCountRef.current = data?.pages?.length || 0
    }
  }, [query, limit])

  return query
}

export function useSearchPopularFeedsMutation() {
  const agent = useAgent()
  const moderationOpts = useModerationOpts()

  return useMutation({
    mutationFn: async (query: string) => {
      const res = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        limit: 10,
        query: query,
      })

      if (moderationOpts) {
        return res.data.feeds.filter(feed => {
          const decision = moderateFeedGenerator(feed, moderationOpts)
          return !decision.ui('contentMedia').blur
        })
      }

      return res.data.feeds
    },
  })
}

const popularFeedsSearchQueryKeyRoot = 'popularFeedsSearch'
export const createPopularFeedsSearchQueryKey = (query: string) => [
  popularFeedsSearchQueryKeyRoot,
  query,
]

export function usePopularFeedsSearch({
  query,
  enabled,
}: {
  query: string
  enabled?: boolean
}) {
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const enabledInner = enabled ?? Boolean(moderationOpts)

  return useQuery({
    enabled: enabledInner,
    queryKey: createPopularFeedsSearchQueryKey(query),
    queryFn: async () => {
      const res = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        limit: 15,
        query: query,
      })

      return res.data.feeds
    },
    placeholderData: keepPreviousData,
    select(data) {
      return data.filter(feed => {
        const decision = moderateFeedGenerator(feed, moderationOpts!)
        return !decision.ui('contentMedia').blur
      })
    },
  })
}

export type SavedFeedSourceInfo = FeedSourceInfo & {
  savedFeed: AppBskyActorDefs.SavedFeed
}

const PWI_DISCOVER_FEED_STUB: SavedFeedSourceInfo = {
  type: 'feed',
  displayName: 'Discover',
  uri: DISCOVER_FEED_URI,
  feedDescriptor: `feedgen|${DISCOVER_FEED_URI}`,
  route: {
    href: '/',
    name: 'Home',
    params: {},
  },
  cid: '',
  avatar: '',
  description: new RichText({text: ''}),
  creatorDid: '',
  creatorHandle: '',
  likeCount: 0,
  likeUri: '',
  // ---
  savedFeed: {
    id: 'pwi-discover',
    ...DISCOVER_SAVED_FEED,
  },
  contentMode: undefined,
}

const pinnedFeedInfosQueryKeyRoot = 'pinnedFeedsInfos'

export function usePinnedFeedsInfos() {
  const {hasSession} = useSession()
  const agent = useAgent()
  const {data: preferences, isLoading: isLoadingPrefs} = usePreferencesQuery()
  const pinnedItems = preferences?.savedFeeds.filter(feed => feed.pinned) ?? []

  return useQuery({
    staleTime: STALE.INFINITY,
    enabled: !isLoadingPrefs,
    queryKey: [
      pinnedFeedInfosQueryKeyRoot,
      (hasSession ? 'authed:' : 'unauthed:') +
        pinnedItems.map(f => f.value).join(','),
    ],
    queryFn: async () => {
      if (!hasSession) {
        return [PWI_DISCOVER_FEED_STUB]
      }

      let resolved = new Map<string, FeedSourceInfo>()

      // Get all feeds. We can do this in a batch.
      const pinnedFeeds = pinnedItems.filter(feed => feed.type === 'feed')
      let feedsPromise = Promise.resolve()
      if (pinnedFeeds.length > 0) {
        feedsPromise = agent.app.bsky.feed
          .getFeedGenerators({
            feeds: pinnedFeeds.map(f => f.value),
          })
          .then(res => {
            for (let i = 0; i < res.data.feeds.length; i++) {
              const feedView = res.data.feeds[i]
              resolved.set(feedView.uri, hydrateFeedGenerator(feedView))
            }
          })
      }

      // Get all lists. This currently has to be done individually.
      const pinnedLists = pinnedItems.filter(feed => feed.type === 'list')
      const listsPromises = pinnedLists.map(list =>
        agent.app.bsky.graph
          .getList({
            list: list.value,
            limit: 1,
          })
          .then(res => {
            const listView = res.data.list
            resolved.set(listView.uri, hydrateList(listView))
          }),
      )

      await feedsPromise // Fail the whole query if it fails.
      await Promise.allSettled(listsPromises) // Ignore individual failing ones.

      // order the feeds/lists in the order they were pinned
      const result: SavedFeedSourceInfo[] = []
      for (let pinnedItem of pinnedItems) {
        const feedInfo = resolved.get(pinnedItem.value)
        if (feedInfo) {
          result.push({
            ...feedInfo,
            savedFeed: pinnedItem,
          })
        } else if (pinnedItem.type === 'timeline') {
          result.push({
            type: 'feed',
            displayName: 'Following',
            uri: pinnedItem.value,
            feedDescriptor: 'following',
            route: {
              href: '/',
              name: 'Home',
              params: {},
            },
            cid: '',
            avatar: '',
            description: new RichText({text: ''}),
            creatorDid: '',
            creatorHandle: '',
            likeCount: 0,
            likeUri: '',
            savedFeed: pinnedItem,
            contentMode: undefined,
          })
        }
      }
      return result
    },
  })
}

export type SavedFeedItem =
  | {
      type: 'feed'
      config: AppBskyActorDefs.SavedFeed
      view: AppBskyFeedDefs.GeneratorView
    }
  | {
      type: 'list'
      config: AppBskyActorDefs.SavedFeed
      view: AppBskyGraphDefs.ListView
    }
  | {
      type: 'timeline'
      config: AppBskyActorDefs.SavedFeed
      view: undefined
    }

export function useSavedFeeds() {
  const agent = useAgent()
  const {data: preferences, isLoading: isLoadingPrefs} = usePreferencesQuery()
  const savedItems = preferences?.savedFeeds ?? []
  const queryClient = useQueryClient()

  return useQuery({
    staleTime: STALE.INFINITY,
    enabled: !isLoadingPrefs,
    queryKey: [pinnedFeedInfosQueryKeyRoot, ...savedItems],
    placeholderData: previousData => {
      return (
        previousData || {
          // The likely count before we try to resolve them.
          count: savedItems.length,
          feeds: [],
        }
      )
    },
    queryFn: async () => {
      const resolvedFeeds = new Map<string, AppBskyFeedDefs.GeneratorView>()
      const resolvedLists = new Map<string, AppBskyGraphDefs.ListView>()

      const savedFeeds = savedItems.filter(feed => feed.type === 'feed')
      const savedLists = savedItems.filter(feed => feed.type === 'list')

      let feedsPromise = Promise.resolve()
      if (savedFeeds.length > 0) {
        feedsPromise = agent.app.bsky.feed
          .getFeedGenerators({
            feeds: savedFeeds.map(f => f.value),
          })
          .then(res => {
            res.data.feeds.forEach(f => {
              resolvedFeeds.set(f.uri, f)
            })
          })
      }

      const listsPromises = savedLists.map(list =>
        agent.app.bsky.graph
          .getList({
            list: list.value,
            limit: 1,
          })
          .then(res => {
            const listView = res.data.list
            resolvedLists.set(listView.uri, listView)
          }),
      )

      await Promise.allSettled([feedsPromise, ...listsPromises])

      resolvedFeeds.forEach(feed => {
        const hydratedFeed = hydrateFeedGenerator(feed)
        precacheFeed(queryClient, hydratedFeed)
      })
      resolvedLists.forEach(list => {
        precacheList(queryClient, list)
      })

      const result: SavedFeedItem[] = []
      for (let savedItem of savedItems) {
        if (savedItem.type === 'timeline') {
          result.push({
            type: 'timeline',
            config: savedItem,
            view: undefined,
          })
        } else if (savedItem.type === 'feed') {
          const resolvedFeed = resolvedFeeds.get(savedItem.value)
          if (resolvedFeed) {
            result.push({
              type: 'feed',
              config: savedItem,
              view: resolvedFeed,
            })
          }
        } else if (savedItem.type === 'list') {
          const resolvedList = resolvedLists.get(savedItem.value)
          if (resolvedList) {
            result.push({
              type: 'list',
              config: savedItem,
              view: resolvedList,
            })
          }
        }
      }

      return {
        // By this point we know the real count.
        count: result.length,
        feeds: result,
      }
    },
  })
}

function precacheFeed(queryClient: QueryClient, hydratedFeed: FeedSourceInfo) {
  precacheResolvedUri(
    queryClient,
    hydratedFeed.creatorHandle,
    hydratedFeed.creatorDid,
  )
  queryClient.setQueryData<FeedSourceInfo>(
    feedSourceInfoQueryKey({uri: hydratedFeed.uri}),
    hydratedFeed,
  )
}

export function precacheList(
  queryClient: QueryClient,
  list: AppBskyGraphDefs.ListView,
) {
  precacheResolvedUri(queryClient, list.creator.handle, list.creator.did)
  queryClient.setQueryData<AppBskyGraphDefs.ListView>(
    listQueryKey(list.uri),
    list,
  )
}

export function precacheFeedFromGeneratorView(
  queryClient: QueryClient,
  view: AppBskyFeedDefs.GeneratorView,
) {
  const hydratedFeed = hydrateFeedGenerator(view)
  precacheFeed(queryClient, hydratedFeed)
}

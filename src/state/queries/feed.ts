import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AppBskyUnspeccedGetPopularFeedGenerators,
  AtUri,
  RichText,
} from '@atproto/api'
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query'

import {DISCOVER_FEED_URI, DISCOVER_SAVED_FEED} from '#/lib/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent, useSession} from '#/state/session'
import {router} from '#/routes'
import {FeedDescriptor} from './post-feed'

export type FeedSourceFeedInfo = {
  type: 'feed'
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
}

export type FeedSourceListInfo = {
  type: 'list'
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

export const useGetPopularFeedsQueryKey = ['getPopularFeeds']

export function useGetPopularFeedsQuery() {
  const agent = useAgent()
  return useInfiniteQuery<
    AppBskyUnspeccedGetPopularFeedGenerators.OutputSchema,
    Error,
    InfiniteData<AppBskyUnspeccedGetPopularFeedGenerators.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: useGetPopularFeedsQueryKey,
    queryFn: async ({pageParam}) => {
      const res = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        limit: 10,
        cursor: pageParam,
      })
      return res.data
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.cursor,
  })
}

export function useSearchPopularFeedsMutation() {
  const agent = useAgent()
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        limit: 10,
        query: query,
      })

      return res.data.feeds
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

      await Promise.allSettled([feedsPromise, ...listsPromises])

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
          })
        }
      }
      return result
    },
  })
}

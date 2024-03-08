import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
  QueryKey,
  useMutation,
} from '@tanstack/react-query'
import {
  AtUri,
  RichText,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AppBskyUnspeccedGetPopularFeedGenerators,
} from '@atproto/api'

import {router} from '#/routes'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {getAgent} from '#/state/session'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {STALE} from '#/state/queries'

export type FeedSourceFeedInfo = {
  type: 'feed'
  uri: string
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

export const feedSourceInfoQueryKey = ({uri}: {uri: string}) => [
  'getFeedSourceInfo',
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

  return useQuery({
    staleTime: STALE.INFINITY,
    queryKey: feedSourceInfoQueryKey({uri}),
    queryFn: async () => {
      let view: FeedSourceInfo

      if (type === 'feed') {
        const res = await getAgent().app.bsky.feed.getFeedGenerator({feed: uri})
        view = hydrateFeedGenerator(res.data.view)
      } else {
        const res = await getAgent().app.bsky.graph.getList({
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
  return useInfiniteQuery<
    AppBskyUnspeccedGetPopularFeedGenerators.OutputSchema,
    Error,
    InfiniteData<AppBskyUnspeccedGetPopularFeedGenerators.OutputSchema>,
    QueryKey,
    string | undefined
  >({
    queryKey: useGetPopularFeedsQueryKey,
    queryFn: async ({pageParam}) => {
      const res = await getAgent().app.bsky.unspecced.getPopularFeedGenerators({
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
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await getAgent().app.bsky.unspecced.getPopularFeedGenerators({
        limit: 10,
        query: query,
      })

      return res.data.feeds
    },
  })
}

const FOLLOWING_FEED_STUB: FeedSourceInfo = {
  type: 'feed',
  displayName: 'Following',
  uri: '',
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
}

export function usePinnedFeedsInfos() {
  const {data: preferences, isLoading: isLoadingPrefs} = usePreferencesQuery()
  const pinnedUris = preferences?.feeds?.pinned ?? []

  return useQuery({
    staleTime: STALE.INFINITY,
    enabled: !isLoadingPrefs,
    queryKey: ['pinnedFeedsInfos', pinnedUris.join(',')],
    queryFn: async () => {
      let resolved = new Map()

      // Get all feeds. We can do this in a batch.
      const feedUris = pinnedUris.filter(
        uri => getFeedTypeFromUri(uri) === 'feed',
      )
      let feedsPromise = Promise.resolve()
      if (feedUris.length > 0) {
        feedsPromise = getAgent()
          .app.bsky.feed.getFeedGenerators({
            feeds: feedUris,
          })
          .then(res => {
            for (let feedView of res.data.feeds) {
              resolved.set(feedView.uri, hydrateFeedGenerator(feedView))
            }
          })
      }

      // Get all lists. This currently has to be done individually.
      const listUris = pinnedUris.filter(
        uri => getFeedTypeFromUri(uri) === 'list',
      )
      const listsPromises = listUris.map(listUri =>
        getAgent()
          .app.bsky.graph.getList({
            list: listUri,
            limit: 1,
          })
          .then(res => {
            const listView = res.data.list
            resolved.set(listView.uri, hydrateList(listView))
          }),
      )

      // The returned result will have the original order.
      const result = [FOLLOWING_FEED_STUB]
      await Promise.allSettled([feedsPromise, ...listsPromises])
      for (let pinnedUri of pinnedUris) {
        if (resolved.has(pinnedUri)) {
          result.push(resolved.get(pinnedUri))
        }
      }
      return result
    },
  })
}

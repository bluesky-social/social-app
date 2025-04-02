import {type AppBskyFeedDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

// import {
//   aggregateUserInterests,
//   createBskyTopicsHeader,
// } from '#/lib/api/feed/utils'
// import {getContentLanguages} from '#/state/preferences/languages'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
// import {useAgent} from '#/state/session'

export const DEFAULT_LIMIT = 5

export const createGetTrendsQueryKey = () => ['suggested-feeds']

export function useGetSuggestedFeedsQuery() {
  // const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()
  const savedFeeds = preferences?.savedFeeds

  return useQuery({
    enabled: !!savedFeeds,
    refetchOnWindowFocus: true,
    staleTime: STALE.MINUTES.ONE,
    queryKey: createGetTrendsQueryKey(),
    queryFn: async () => {
      /*
      const contentLangs = getContentLanguages().join(',')
      const {data} = await agent.app.bsky.unspecced.getSuggestedFeeds(
        {
          limit: DEFAULT_LIMIT,
        },
        {
          headers: {
            ...createBskyTopicsHeader(aggregateUserInterests(preferences)),
            'Accept-Language': contentLangs,
          },
        },
      )
      return data
      */
      const feeds = [
        {
          uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
          cid: 'bafyreievgu2ty7qbiaaom5zhmkznsnajuzideek3lo7e65dwqlrvrxnmo4',
          did: 'did:web:discover.bsky.app',
          creator: {
            did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
            handle: 'bsky.app',
            displayName: 'Bluesky',
            avatar:
              'https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreihagr2cmvl2jt4mgx3sppwe2it3fwolkrbtjrhcnwjk4jdijhsoze@jpeg',
            associated: {
              chat: {
                allowIncoming: 'none',
              },
            },
            viewer: {
              muted: false,
              blockedBy: false,
              following:
                'at://did:plc:3jpt2mvvsumj2r7eqk4gzzjz/app.bsky.graph.follow/3kjojq5fi2725',
            },
            labels: [],
            createdAt: '2023-04-12T04:53:57.057Z',
            description:
              'official Bluesky account (check username👆)\n\nBugs, feature requests, feedback: support@bsky.app',
            indexedAt: '2024-12-18T07:43:57.513Z',
          },
          displayName: 'Discover',
          description: 'Trending content from your personal network',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreidljdg62x3zhlweyzshoekrw2znokytt5tmib7g4xsngwvpnf6ule@jpeg',
          likeCount: 36890,
          labels: [],
          viewer: {
            like: 'at://did:plc:3jpt2mvvsumj2r7eqk4gzzjz/app.bsky.feed.like/3ld2jp4c6bl2a',
          },
          indexedAt: '2023-05-19T23:19:19.592Z',
        },
        {
          uri: 'at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.generator/verified-news',
          cid: 'bafyreidixnudxcuyzwyextzjgsklwqb7yp4wjnmn3ktfeaa3mcwtgdhsne',
          did: 'did:web:api.graze.social',
          creator: {
            did: 'did:plc:kkf4naxqmweop7dv4l2iqqf5',
            handle: 'aendra.com',
            displayName: 'ændra.',
            avatar:
              'https://cdn.bsky.app/img/avatar/plain/did:plc:kkf4naxqmweop7dv4l2iqqf5/bafkreiaqkfr6ikrkn2hj2tcapzmcxtkc3qo6hqwjvg4kn7r5f2cmbisstu@jpeg',
            associated: {
              chat: {
                allowIncoming: 'following',
              },
            },
            viewer: {
              muted: false,
              blockedBy: false,
              following:
                'at://did:plc:3jpt2mvvsumj2r7eqk4gzzjz/app.bsky.graph.follow/3kikz7w74nn25',
              followedBy:
                'at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.graph.follow/3kikzfqsybo24',
            },
            labels: [],
            createdAt: '2023-05-04T16:59:41.121Z',
            description:
              'Creator of 📰 News feed, @xblock.aendra.dev, @moji.blue.\n\nOpinions my own, and usually terrible.\n\nshe/her/ze/hir 🏳️‍⚧️\n\n🌐 aendra.com\n📷 aendra.photos\n🎧 soundcloud.com/aendra\n📺 youtube.com/@aendra\n💻 github.com/aendra-rininsland',
            indexedAt: '2025-03-07T21:21:53.813Z',
          },
          displayName: '📰 News',
          description:
            'Headlines from verified news organisations in reverse-chronological order. Maintained by @aendra.com. ',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:kkf4naxqmweop7dv4l2iqqf5/bafkreidkhn7fiyy34cz3cwtvtffqn2m77hpfjnsruso3r66efcrmdcegd4@jpeg',
          likeCount: 23157,
          labels: [],
          viewer: {
            like: 'at://did:plc:3jpt2mvvsumj2r7eqk4gzzjz/app.bsky.feed.like/3kikzby65fx2e',
          },
          indexedAt: '2025-03-26T22:13:07.276Z',
        },
      ] as AppBskyFeedDefs.GeneratorView[]

      return {
        feeds: feeds.filter(feed => {
          const isSaved = !!savedFeeds?.find(s => s.value === feed.uri)
          return !isSaved
        }),
      }
    },
  })
}

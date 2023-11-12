import {useQuery} from '@tanstack/react-query'
import {AtUri, RichText, AppBskyFeedDefs, AppBskyGraphDefs} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useSession} from '#/state/session'

type FeedSourceInfo =
  | {
      type: 'feed'
      uri: string
      cid: string
      avatar: string | undefined
      displayName: string
      description: RichText
      creatorDid: string
      creatorHandle: string
      likeCount: number | undefined
      likeUri: string | undefined
    }
  | {
      type: 'list'
      uri: string
      cid: string
      avatar: string | undefined
      displayName: string
      description: RichText
      creatorDid: string
      creatorHandle: string
    }

export const useFeedSourceInfoQueryKey = ({uri}: {uri: string}) => [
  'getFeedSourceInfo',
  uri,
]

const feedSourceNSIDs = {
  feed: 'app.bsky.feed.generator',
  list: 'app.bsky.graph.list',
}

function hydrateFeedGenerator(
  view: AppBskyFeedDefs.GeneratorView,
): FeedSourceInfo {
  return {
    type: 'feed',
    uri: view.uri,
    cid: view.cid,
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

function hydrateList(view: AppBskyGraphDefs.ListView): FeedSourceInfo {
  return {
    type: 'list',
    uri: view.uri,
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

export function useFeedSourceInfoQuery({uri}: {uri: string}) {
  const {agent} = useSession()
  const {pathname} = new AtUri(uri)
  const type = pathname.includes(feedSourceNSIDs.feed) ? 'feed' : 'list'

  return useQuery({
    queryKey: useFeedSourceInfoQueryKey({uri}),
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

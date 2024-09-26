import {AppBskyFeedPost, AppBskyGraphDefs, AtUri} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {PostRecordEmbed} from '#/view/com/composer-new/state'
import {ComposerOptsQuote} from '../shell/composer'
import {FeedSourceFeedInfo, hydrateFeedGenerator} from './feed'

type RecordKind = 'feed' | 'list' | 'post'

const RQKEY_ROOT = 'record-meta'
export const RQKEY = (kind: RecordKind, url: string) => [RQKEY_ROOT, kind, url]

type FeedRecord = {kind: 'feed'; data: FeedSourceFeedInfo}
type ListRecord = {kind: 'list'; data: AppBskyGraphDefs.ListView}
type PostRecord = {kind: 'post'; data: ComposerOptsQuote}

export type RecordReturn = FeedRecord | ListRecord | PostRecord

export function useRecordMetaQuery(meta: PostRecordEmbed) {
  const agent = useAgent()

  const kind = meta.kind
  const uri = meta.uri

  return useQuery({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(kind, uri),
    async queryFn(): Promise<RecordReturn> {
      const urip = new AtUri(uri)

      if (!urip.host.startsWith('did:')) {
        const res = await agent.resolveHandle({
          handle: urip.host,
        })
        urip.host = res.data.did
      }

      if (kind === 'feed') {
        const {data} = await agent.app.bsky.feed.getFeedGenerator({
          feed: urip.toString(),
        })

        return {kind, data: hydrateFeedGenerator(data.view)}
      }

      if (kind === 'list') {
        const {data} = await agent.app.bsky.graph.getList({
          list: urip.toString(),
          limit: 1,
        })

        return {kind, data: data.list}
      }

      if (kind === 'post') {
        const {data} = await agent.app.bsky.feed.getPosts({
          uris: [urip.toString()],
        })

        const post = data.posts[0]
        if (!post) {
          throw new Error(`Post not found`)
        }

        const quote: ComposerOptsQuote = {
          uri: post.uri,
          cid: post.cid,
          text: AppBskyFeedPost.isRecord(post.record) ? post.record.text : '',
          indexedAt: post.indexedAt,
          author: post.author,
        }

        return {kind, data: quote}
      }

      throw new Error(`Unknown kind ${kind}`)
    },
    initialData(): RecordReturn | undefined {
      if (kind === 'post' && meta.data) {
        return {kind: 'post', data: meta.data}
      }
    },
  })
}

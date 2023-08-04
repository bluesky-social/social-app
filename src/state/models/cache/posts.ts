import {LRUMap} from 'lru_map'
import {RootStoreModel} from '../root-store'
import {
  AppBskyFeedDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
} from '@atproto/api'

type PostView = AppBskyFeedDefs.PostView

export class PostsCache {
  cache: LRUMap<string, PostView> = new LRUMap(500)

  constructor(public rootStore: RootStoreModel) {}

  set(uri: string, postView: PostView) {
    this.cache.set(uri, postView)
    if (postView.author.handle) {
      this.rootStore.handleResolutions.cache.set(
        postView.author.handle,
        postView.author.did,
      )
    }
  }

  fromFeedItem(feedItem: AppBskyFeedDefs.FeedViewPost) {
    this.set(feedItem.post.uri, feedItem.post)
    if (
      feedItem.reply?.parent &&
      AppBskyFeedDefs.isPostView(feedItem.reply?.parent)
    ) {
      this.set(feedItem.reply.parent.uri, feedItem.reply.parent)
    }
    const embed = feedItem.post.embed
    if (
      AppBskyEmbedRecord.isView(embed) &&
      AppBskyEmbedRecord.isViewRecord(embed.record) &&
      AppBskyFeedPost.isRecord(embed.record.value) &&
      AppBskyFeedPost.validateRecord(embed.record.value).success
    ) {
      this.set(embed.record.uri, embedViewToPostView(embed.record))
    }
    if (
      AppBskyEmbedRecordWithMedia.isView(embed) &&
      AppBskyEmbedRecord.isViewRecord(embed.record?.record) &&
      AppBskyFeedPost.isRecord(embed.record.record.value) &&
      AppBskyFeedPost.validateRecord(embed.record.record.value).success
    ) {
      this.set(
        embed.record.record.uri,
        embedViewToPostView(embed.record.record),
      )
    }
  }
}

function embedViewToPostView(
  embedView: AppBskyEmbedRecord.ViewRecord,
): PostView {
  return {
    $type: 'app.bsky.feed.post#view',
    uri: embedView.uri,
    cid: embedView.cid,
    author: embedView.author,
    record: embedView.value,
    indexedAt: embedView.indexedAt,
    labels: embedView.labels,
  }
}

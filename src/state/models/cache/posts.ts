import {LRUMap} from 'lru_map'
import {RootStoreModel} from '../root-store'
import {AppBskyFeedDefs} from '@atproto/api'

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
  }
}

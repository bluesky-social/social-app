import {
  AppBskyFeedDefs,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
} from '@atproto/api'
import {FeedAPI, FeedAPIResponse} from './types'
import {getAgent} from '#/state/session'

export class AuthorFeedAPI implements FeedAPI {
  constructor(public params: GetAuthorFeed.QueryParams) {}

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await getAgent().getAuthorFeed({
      ...this.params,
      limit: 1,
    })
    return res.data.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const res = await getAgent().getAuthorFeed({
      ...this.params,
      cursor,
      limit,
    })
    if (res.success) {
      return {
        cursor: res.data.cursor,
        feed: this._filter(res.data.feed),
      }
    }
    return {
      feed: [],
    }
  }

  _filter(feed: AppBskyFeedDefs.FeedViewPost[]) {
    if (this.params.filter === 'posts_no_replies') {
      return feed.filter(post => {
        const isReply = post.reply
        const isRepost = AppBskyFeedDefs.isReasonRepost(post.reason)
        if (!isReply) return true
        if (isRepost) return true
        return isReply && isAuthorReplyChain(this.params.actor, post, feed)
      })
    }

    return feed
  }
}

function isAuthorReplyChain(
  actor: string,
  post: AppBskyFeedDefs.FeedViewPost,
  posts: AppBskyFeedDefs.FeedViewPost[],
): boolean {
  // current post is by a different user (shouldn't happen)
  if (post.post.author.handle !== actor) return false

  const replyParent = post.reply?.parent

  if (AppBskyFeedDefs.isPostView(replyParent)) {
    // reply parent is by a different user
    if (replyParent.author.handle !== actor) return false

    // A top-level post that matches the parent of the current post.
    const parentPost = posts.find(p => p.post.uri === replyParent.uri)

    /*
     * Either we haven't fetched the parent at the top level, or the only
     * record we have is on feedItem.reply.parent, which we've already checked
     * above.
     */
    if (!parentPost) return true

    // Walk up to parent
    return isAuthorReplyChain(actor, parentPost, posts)
  }

  // Just default to showing it
  return true
}

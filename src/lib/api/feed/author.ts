import {
  AppBskyFeedDefs,
  AppBskyFeedGetAuthorFeed as GetAuthorFeed,
  BskyAgent,
} from '@atproto/api'

import {FeedAPI, FeedAPIResponse} from './types'

export class AuthorFeedAPI implements FeedAPI {
  agent: BskyAgent
  _params: GetAuthorFeed.QueryParams

  constructor({
    agent,
    feedParams,
  }: {
    agent: BskyAgent
    feedParams: GetAuthorFeed.QueryParams
  }) {
    this.agent = agent
    this._params = feedParams
  }

  get params() {
    const params = {...this._params}
    params.includePins = params.filter !== 'posts_with_media'
    return params
  }

  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    const res = await this.agent.getAuthorFeed({
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
    const res = await this.agent.getAuthorFeed({
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
    if (this.params.filter === 'posts_and_author_threads') {
      return feed.filter(post => {
        const isReply = post.reply
        const isRepost = AppBskyFeedDefs.isReasonRepost(post.reason)
        const isPin = AppBskyFeedDefs.isReasonPin(post.reason)
        if (!isReply) return true
        if (isRepost || isPin) return true
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
  if (post.post.author.did !== actor) return false

  const replyParent = post.reply?.parent

  if (AppBskyFeedDefs.isPostView(replyParent)) {
    // reply parent is by a different user
    if (replyParent.author.did !== actor) return false

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

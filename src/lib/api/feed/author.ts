import {type Client} from '@atproto/lex-client'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {type FeedAPI, type FeedAPIResponse} from './types'

export class AuthorFeedAPI implements FeedAPI {
  client: Client
  _params: app.bsky.feed.getAuthorFeed.$Params

  constructor({
    client,
    feedParams,
  }: {
    client: Client
    feedParams: app.bsky.feed.getAuthorFeed.$Params
  }) {
    this.client = client
    this._params = feedParams
  }

  get params() {
    const params = {...this._params}
    params.includePins = params.filter === 'posts_and_author_threads'
    return params
  }

  async peekLatest(): Promise<app.bsky.feed.defs.FeedViewPost> {
    const res = await this.client.call(app.bsky.feed.getAuthorFeed, {
      ...this.params,
      limit: 1,
    })
    return res.feed[0]
  }

  async fetch({
    cursor,
    limit,
  }: {
    cursor: string | undefined
    limit: number
  }): Promise<FeedAPIResponse> {
    const res = await this.client.call(app.bsky.feed.getAuthorFeed, {
      ...this.params,
      cursor,
      limit,
    })
    return {
      cursor: res.cursor,
      feed: this._filter(res.feed),
    }
  }

  _filter(feed: app.bsky.feed.defs.FeedViewPost[]) {
    if (this.params.filter === 'posts_and_author_threads') {
      return feed.filter(post => {
        const isReply = post.reply
        const isRepost = bsky.isType(
          app.bsky.feed.defs.reasonRepost,
          post.reason,
        )
        const isPin = bsky.isType(app.bsky.feed.defs.reasonPin, post.reason)
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
  post: app.bsky.feed.defs.FeedViewPost,
  posts: app.bsky.feed.defs.FeedViewPost[],
): boolean {
  // current post is by a different user (shouldn't happen)
  if (post.post.author.did !== actor) return false

  const replyParent = post.reply?.parent

  if (bsky.isType(app.bsky.feed.defs.postView, replyParent)) {
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

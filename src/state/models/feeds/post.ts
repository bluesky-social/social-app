import {makeAutoObservable} from 'mobx'
import {
  AppBskyFeedPost as FeedPost,
  AppBskyFeedDefs,
  RichText,
  moderatePost,
  PostModeration,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {updateDataOptimistically} from 'lib/async/revertible'
import {track} from 'lib/analytics/analytics'
import {hackAddDeletedEmbed} from 'lib/api/hack-add-deleted-embed'

type FeedViewPost = AppBskyFeedDefs.FeedViewPost
type ReasonRepost = AppBskyFeedDefs.ReasonRepost
type PostView = AppBskyFeedDefs.PostView

export class PostsFeedItemModel {
  // ui state
  _reactKey: string = ''

  // data
  post: PostView
  postRecord?: FeedPost.Record
  reply?: FeedViewPost['reply']
  reason?: FeedViewPost['reason']
  richText?: RichText

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: FeedViewPost,
  ) {
    this._reactKey = reactKey
    this.post = v.post
    if (FeedPost.isRecord(this.post.record)) {
      const valid = FeedPost.validateRecord(this.post.record)
      if (valid.success) {
        hackAddDeletedEmbed(this.post)
        this.postRecord = this.post.record
        this.richText = new RichText(this.postRecord, {cleanNewlines: true})
      } else {
        this.postRecord = undefined
        this.richText = undefined
        rootStore.log.warn(
          'Received an invalid app.bsky.feed.post record',
          valid.error,
        )
      }
    } else {
      this.postRecord = undefined
      this.richText = undefined
      rootStore.log.warn(
        'app.bsky.feed.getTimeline or app.bsky.feed.getAuthorFeed served an unexpected record type',
        this.post.record,
      )
    }
    this.reply = v.reply
    this.reason = v.reason
    makeAutoObservable(this, {rootStore: false})
  }

  get uri() {
    return this.post.uri
  }

  get parentUri() {
    return this.postRecord?.reply?.parent.uri
  }

  get rootUri(): string {
    if (typeof this.postRecord?.reply?.root.uri === 'string') {
      return this.postRecord?.reply?.root.uri
    }
    return this.post.uri
  }

  get isThreadMuted() {
    return this.rootStore.mutedThreads.uris.has(this.rootUri)
  }

  get moderation(): PostModeration {
    return moderatePost(this.post, this.rootStore.preferences.moderationOpts)
  }

  copy(v: FeedViewPost) {
    this.post = v.post
    this.reply = v.reply
    this.reason = v.reason
  }

  copyMetrics(v: FeedViewPost) {
    this.post.replyCount = v.post.replyCount
    this.post.repostCount = v.post.repostCount
    this.post.likeCount = v.post.likeCount
    this.post.viewer = v.post.viewer
  }

  get reasonRepost(): ReasonRepost | undefined {
    if (this.reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
      return this.reason as ReasonRepost
    }
  }

  async toggleLike() {
    this.post.viewer = this.post.viewer || {}
    try {
      if (this.post.viewer.like) {
        // unlike
        const url = this.post.viewer.like
        await updateDataOptimistically(
          this.post,
          () => {
            this.post.likeCount = (this.post.likeCount || 0) - 1
            this.post.viewer!.like = undefined
          },
          () => this.rootStore.agent.deleteLike(url),
        )
      } else {
        // like
        await updateDataOptimistically(
          this.post,
          () => {
            this.post.likeCount = (this.post.likeCount || 0) + 1
            this.post.viewer!.like = 'pending'
          },
          () => this.rootStore.agent.like(this.post.uri, this.post.cid),
          res => {
            this.post.viewer!.like = res.uri
          },
        )
      }
    } catch (error) {
      this.rootStore.log.error('Failed to toggle like', error)
    } finally {
      track(this.post.viewer.like ? 'Post:Unlike' : 'Post:Like')
    }
  }

  async toggleRepost() {
    this.post.viewer = this.post.viewer || {}
    try {
      if (this.post.viewer?.repost) {
        const url = this.post.viewer.repost
        await updateDataOptimistically(
          this.post,
          () => {
            this.post.repostCount = (this.post.repostCount || 0) - 1
            this.post.viewer!.repost = undefined
          },
          () => this.rootStore.agent.deleteRepost(url),
        )
      } else {
        await updateDataOptimistically(
          this.post,
          () => {
            this.post.repostCount = (this.post.repostCount || 0) + 1
            this.post.viewer!.repost = 'pending'
          },
          () => this.rootStore.agent.repost(this.post.uri, this.post.cid),
          res => {
            this.post.viewer!.repost = res.uri
          },
        )
      }
    } catch (error) {
      this.rootStore.log.error('Failed to toggle repost', error)
    } finally {
      track(this.post.viewer.repost ? 'Post:Unrepost' : 'Post:Repost')
    }
  }

  async toggleThreadMute() {
    try {
      if (this.isThreadMuted) {
        this.rootStore.mutedThreads.uris.delete(this.rootUri)
      } else {
        this.rootStore.mutedThreads.uris.add(this.rootUri)
      }
    } catch (error) {
      this.rootStore.log.error('Failed to toggle thread mute', error)
    } finally {
      track(this.isThreadMuted ? 'Post:ThreadUnmute' : 'Post:ThreadMute')
    }
  }

  async delete() {
    try {
      await this.rootStore.agent.deletePost(this.post.uri)
      this.rootStore.emitPostDeleted(this.post.uri)
    } catch (error) {
      this.rootStore.log.error('Failed to delete post', error)
    } finally {
      track('Post:Delete')
    }
  }
}

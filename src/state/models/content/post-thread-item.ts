import {makeAutoObservable} from 'mobx'
import {
  AppBskyFeedPost as FeedPost,
  AppBskyFeedDefs,
  RichText,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {updateDataOptimistically} from 'lib/async/revertible'
import {PostLabelInfo, PostModeration} from 'lib/labeling/types'
import {
  getEmbedLabels,
  getEmbedMuted,
  getEmbedMutedByList,
  getEmbedBlocking,
  getEmbedBlockedBy,
  filterAccountLabels,
  filterProfileLabels,
  getPostModeration,
} from 'lib/labeling/helpers'

export class PostThreadItemModel {
  // ui state
  _reactKey: string = ''
  _depth = 0
  _isHighlightedPost = false
  _showParentReplyLine = false
  _showChildReplyLine = false
  _hasMore = false

  // data
  post: AppBskyFeedDefs.PostView
  postRecord?: FeedPost.Record
  parent?:
    | PostThreadItemModel
    | AppBskyFeedDefs.NotFoundPost
    | AppBskyFeedDefs.BlockedPost
  replies?: (PostThreadItemModel | AppBskyFeedDefs.NotFoundPost)[]
  richText?: RichText

  get uri() {
    return this.post.uri
  }

  get parentUri() {
    return this.postRecord?.reply?.parent.uri
  }

  get rootUri(): string {
    if (this.postRecord?.reply?.root.uri) {
      return this.postRecord.reply.root.uri
    }
    return this.uri
  }

  get isThreadMuted() {
    return this.rootStore.mutedThreads.uris.has(this.rootUri)
  }

  get labelInfo(): PostLabelInfo {
    return {
      postLabels: (this.post.labels || []).concat(
        getEmbedLabels(this.post.embed),
      ),
      accountLabels: filterAccountLabels(this.post.author.labels),
      profileLabels: filterProfileLabels(this.post.author.labels),
      isMuted:
        this.post.author.viewer?.muted ||
        getEmbedMuted(this.post.embed) ||
        false,
      mutedByList:
        this.post.author.viewer?.mutedByList ||
        getEmbedMutedByList(this.post.embed),
      isBlocking:
        !!this.post.author.viewer?.blocking ||
        getEmbedBlocking(this.post.embed) ||
        false,
      isBlockedBy:
        !!this.post.author.viewer?.blockedBy ||
        getEmbedBlockedBy(this.post.embed) ||
        false,
    }
  }

  get moderation(): PostModeration {
    return getPostModeration(this.rootStore, this.labelInfo)
  }

  constructor(
    public rootStore: RootStoreModel,
    v: AppBskyFeedDefs.ThreadViewPost,
  ) {
    this._reactKey = `thread-${v.post.uri}`
    this.post = v.post
    if (FeedPost.isRecord(this.post.record)) {
      const valid = FeedPost.validateRecord(this.post.record)
      if (valid.success) {
        this.postRecord = this.post.record
        this.richText = new RichText(this.postRecord, {cleanNewlines: true})
      } else {
        rootStore.log.warn(
          'Received an invalid app.bsky.feed.post record',
          valid.error,
        )
      }
    } else {
      rootStore.log.warn(
        'app.bsky.feed.getPostThread served an unexpected record type',
        this.post.record,
      )
    }
    // replies and parent are handled via assignTreeModels
    makeAutoObservable(this, {rootStore: false})
  }

  assignTreeModels(
    v: AppBskyFeedDefs.ThreadViewPost,
    highlightedPostUri: string,
    includeParent = true,
    includeChildren = true,
  ) {
    // parents
    if (includeParent && v.parent) {
      if (AppBskyFeedDefs.isThreadViewPost(v.parent)) {
        const parentModel = new PostThreadItemModel(this.rootStore, v.parent)
        parentModel._depth = this._depth - 1
        parentModel._showChildReplyLine = true
        if (v.parent.parent) {
          parentModel._showParentReplyLine = true
          parentModel.assignTreeModels(
            v.parent,
            highlightedPostUri,
            true,
            false,
          )
        }
        this.parent = parentModel
      } else if (AppBskyFeedDefs.isNotFoundPost(v.parent)) {
        this.parent = v.parent
      } else if (AppBskyFeedDefs.isBlockedPost(v.parent)) {
        this.parent = v.parent
      }
    }
    // replies
    if (includeChildren && v.replies) {
      const replies = []
      for (const item of v.replies) {
        if (AppBskyFeedDefs.isThreadViewPost(item)) {
          const itemModel = new PostThreadItemModel(this.rootStore, item)
          itemModel._depth = this._depth + 1
          itemModel._showParentReplyLine =
            itemModel.parentUri !== highlightedPostUri && replies.length === 0
          if (item.replies?.length) {
            itemModel._showChildReplyLine = true
            itemModel.assignTreeModels(item, highlightedPostUri, false, true)
          }
          replies.push(itemModel)
        } else if (AppBskyFeedDefs.isNotFoundPost(item)) {
          replies.push(item)
        }
      }
      this.replies = replies
    }
  }

  async toggleLike() {
    this.post.viewer = this.post.viewer || {}
    if (this.post.viewer.like) {
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
  }

  async toggleRepost() {
    this.post.viewer = this.post.viewer || {}
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
  }

  async toggleThreadMute() {
    if (this.isThreadMuted) {
      this.rootStore.mutedThreads.uris.delete(this.rootUri)
    } else {
      this.rootStore.mutedThreads.uris.add(this.rootUri)
    }
  }

  async delete() {
    await this.rootStore.agent.deletePost(this.post.uri)
    this.rootStore.emitPostDeleted(this.post.uri)
  }
}

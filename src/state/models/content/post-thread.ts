import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedGetPostThread as GetPostThread,
  AppBskyFeedPost as FeedPost,
  AppBskyFeedDefs,
  RichText,
} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
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

export class PostThreadModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  notFound = false
  resolvedUri = ''
  params: GetPostThread.QueryParams

  // data
  thread?: PostThreadItemModel
  isBlocked = false

  constructor(
    public rootStore: RootStoreModel,
    params: GetPostThread.QueryParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.params = params
  }

  static fromPostView(
    rootStore: RootStoreModel,
    postView: AppBskyFeedDefs.PostView,
  ) {
    const model = new PostThreadModel(rootStore, {uri: postView.uri})
    model.resolvedUri = postView.uri
    model.hasLoaded = true
    model.thread = new PostThreadItemModel(rootStore, {
      post: postView,
    })
    return model
  }

  get hasContent() {
    return typeof this.thread !== 'undefined'
  }

  get hasError() {
    return this.error !== ''
  }

  get rootUri(): string {
    if (this.thread) {
      if (this.thread.postRecord?.reply?.root.uri) {
        return this.thread.postRecord.reply.root.uri
      }
    }
    return this.resolvedUri
  }

  get isThreadMuted() {
    return this.rootStore.mutedThreads.uris.has(this.rootUri)
  }

  // public api
  // =

  /**
   * Load for first render
   */
  async setup() {
    if (!this.resolvedUri) {
      await this._resolveUri()
    }
    if (this.hasContent) {
      await this.update()
    } else {
      await this._load()
    }
  }

  /**
   * Register any event listeners. Returns a cleanup function.
   */
  registerListeners() {
    const sub = this.rootStore.onPostDeleted(this.onPostDeleted.bind(this))
    return () => sub.remove()
  }

  /**
   * Reset and load
   */
  async refresh() {
    await this._load(true)
  }

  /**
   * Update content in-place
   */
  async update() {
    // NOTE: it currently seems that a full load-and-replace works fine for this
    //       if the UI loses its place or has jarring re-arrangements, replace this
    //       with a more in-place update
    this._load()
  }

  /**
   * Refreshes when posts are deleted
   */
  onPostDeleted(_uri: string) {
    this.refresh()
  }

  async toggleThreadMute() {
    if (this.isThreadMuted) {
      this.rootStore.mutedThreads.uris.delete(this.rootUri)
    } else {
      this.rootStore.mutedThreads.uris.add(this.rootUri)
    }
  }

  // state transitions
  // =

  _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
    this.notFound = false
  }

  _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch post thread', err)
    }
    this.notFound = err instanceof GetPostThread.NotFoundError
  }

  // loader functions
  // =

  async _resolveUri() {
    const urip = new AtUri(this.params.uri)
    if (!urip.host.startsWith('did:')) {
      try {
        urip.host = await apilib.resolveName(this.rootStore, urip.host)
      } catch (e: any) {
        runInAction(() => {
          this.error = e.toString()
        })
      }
    }
    runInAction(() => {
      this.resolvedUri = urip.toString()
    })
  }

  async _load(isRefreshing = false) {
    if (this.hasLoaded && !isRefreshing) {
      return
    }
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.agent.getPostThread(
        Object.assign({}, this.params, {uri: this.resolvedUri}),
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      console.log(e)
      this._xIdle(e)
    }
  }

  _replaceAll(res: GetPostThread.Response) {
    this.isBlocked = AppBskyFeedDefs.isBlockedPost(res.data.thread)
    if (this.isBlocked) {
      return
    }
    pruneReplies(res.data.thread)
    sortThread(res.data.thread)
    const thread = new PostThreadItemModel(
      this.rootStore,
      res.data.thread as AppBskyFeedDefs.ThreadViewPost,
    )
    thread._isHighlightedPost = true
    thread.assignTreeModels(
      res.data.thread as AppBskyFeedDefs.ThreadViewPost,
      thread.uri,
    )
    this.thread = thread
  }
}

type MaybePost =
  | AppBskyFeedDefs.ThreadViewPost
  | AppBskyFeedDefs.NotFoundPost
  | AppBskyFeedDefs.BlockedPost
  | {[k: string]: unknown; $type: string}
function pruneReplies(post: MaybePost) {
  if (post.replies) {
    post.replies = (post.replies as MaybePost[]).filter((reply: MaybePost) => {
      if (reply.blocked) {
        return false
      }
      pruneReplies(reply)
      return true
    })
  }
}

function sortThread(post: MaybePost) {
  if (post.notFound) {
    return
  }
  post = post as AppBskyFeedDefs.ThreadViewPost
  if (post.replies) {
    post.replies.sort((a: MaybePost, b: MaybePost) => {
      post = post as AppBskyFeedDefs.ThreadViewPost
      if (a.notFound) {
        return 1
      }
      if (b.notFound) {
        return -1
      }
      a = a as AppBskyFeedDefs.ThreadViewPost
      b = b as AppBskyFeedDefs.ThreadViewPost
      const aIsByOp = a.post.author.did === post.post.author.did
      const bIsByOp = b.post.author.did === post.post.author.did
      if (aIsByOp && bIsByOp) {
        return a.post.indexedAt.localeCompare(b.post.indexedAt) // oldest
      } else if (aIsByOp) {
        return -1 // op's own reply
      } else if (bIsByOp) {
        return 1 // op's own reply
      }
      return b.post.indexedAt.localeCompare(a.post.indexedAt) // newest
    })
    post.replies.forEach(reply => sortThread(reply))
  }
}

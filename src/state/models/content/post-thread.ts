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

function* reactKeyGenerator(): Generator<string> {
  let counter = 0
  while (true) {
    yield `item-${counter++}`
  }
}

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
  parent?: PostThreadItemModel | AppBskyFeedDefs.NotFoundPost
  replies?: (PostThreadItemModel | AppBskyFeedDefs.NotFoundPost)[]
  richText?: RichText

  get uri() {
    return this.post.uri
  }

  get parentUri() {
    return this.postRecord?.reply?.parent.uri
  }

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: AppBskyFeedDefs.ThreadViewPost,
  ) {
    this._reactKey = reactKey
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
    keyGen: Generator<string>,
    v: AppBskyFeedDefs.ThreadViewPost,
    higlightedPostUri: string,
    includeParent = true,
    includeChildren = true,
  ) {
    // parents
    if (includeParent && v.parent) {
      if (AppBskyFeedDefs.isThreadViewPost(v.parent)) {
        const parentModel = new PostThreadItemModel(
          this.rootStore,
          keyGen.next().value,
          v.parent,
        )
        parentModel._depth = this._depth - 1
        parentModel._showChildReplyLine = true
        if (v.parent.parent) {
          parentModel._showParentReplyLine = true //parentModel.uri !== higlightedPostUri
          parentModel.assignTreeModels(
            keyGen,
            v.parent,
            higlightedPostUri,
            true,
            false,
          )
        }
        this.parent = parentModel
      } else if (AppBskyFeedDefs.isNotFoundPost(v.parent)) {
        this.parent = v.parent
      }
    }
    // replies
    if (includeChildren && v.replies) {
      const replies = []
      for (const item of v.replies) {
        if (AppBskyFeedDefs.isThreadViewPost(item)) {
          const itemModel = new PostThreadItemModel(
            this.rootStore,
            keyGen.next().value,
            item,
          )
          itemModel._depth = this._depth + 1
          itemModel._showParentReplyLine =
            itemModel.parentUri !== higlightedPostUri
          if (item.replies?.length) {
            itemModel._showChildReplyLine = true
            itemModel.assignTreeModels(
              keyGen,
              item,
              higlightedPostUri,
              false,
              true,
            )
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
    if (this.post.viewer?.like) {
      await this.rootStore.agent.deleteLike(this.post.viewer.like)
      runInAction(() => {
        this.post.likeCount = this.post.likeCount || 0
        this.post.viewer = this.post.viewer || {}
        this.post.likeCount--
        this.post.viewer.like = undefined
      })
    } else {
      const res = await this.rootStore.agent.like(this.post.uri, this.post.cid)
      runInAction(() => {
        this.post.likeCount = this.post.likeCount || 0
        this.post.viewer = this.post.viewer || {}
        this.post.likeCount++
        this.post.viewer.like = res.uri
      })
    }
  }

  async toggleRepost() {
    if (this.post.viewer?.repost) {
      await this.rootStore.agent.deleteRepost(this.post.viewer.repost)
      runInAction(() => {
        this.post.repostCount = this.post.repostCount || 0
        this.post.viewer = this.post.viewer || {}
        this.post.repostCount--
        this.post.viewer.repost = undefined
      })
    } else {
      const res = await this.rootStore.agent.repost(
        this.post.uri,
        this.post.cid,
      )
      runInAction(() => {
        this.post.repostCount = this.post.repostCount || 0
        this.post.viewer = this.post.viewer || {}
        this.post.repostCount++
        this.post.viewer.repost = res.uri
      })
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

  get hasContent() {
    return typeof this.thread !== 'undefined'
  }

  get hasError() {
    return this.error !== ''
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
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.agent.getPostThread(
        Object.assign({}, this.params, {uri: this.resolvedUri}),
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  _replaceAll(res: GetPostThread.Response) {
    sortThread(res.data.thread)
    const keyGen = reactKeyGenerator()
    const thread = new PostThreadItemModel(
      this.rootStore,
      keyGen.next().value,
      res.data.thread as AppBskyFeedDefs.ThreadViewPost,
    )
    thread._isHighlightedPost = true
    thread.assignTreeModels(
      keyGen,
      res.data.thread as AppBskyFeedDefs.ThreadViewPost,
      thread.uri,
    )
    this.thread = thread
  }
}

type MaybePost =
  | AppBskyFeedDefs.ThreadViewPost
  | AppBskyFeedDefs.NotFoundPost
  | {[k: string]: unknown; $type: string}
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

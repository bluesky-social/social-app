import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyFeedGetPostThread as GetPostThread,
  AppBskyFeedPost as FeedPost,
} from '@atproto/api'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from './root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
import {RichText} from 'lib/strings/rich-text'

function* reactKeyGenerator(): Generator<string> {
  let counter = 0
  while (true) {
    yield `item-${counter++}`
  }
}

export class PostThreadViewPostModel {
  // ui state
  _reactKey: string = ''
  _depth = 0
  _isHighlightedPost = false
  _hasMore = false

  // data
  post: FeedPost.View
  postRecord?: FeedPost.Record
  parent?: PostThreadViewPostModel | GetPostThread.NotFoundPost
  replies?: (PostThreadViewPostModel | GetPostThread.NotFoundPost)[]
  richText?: RichText

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: GetPostThread.ThreadViewPost,
  ) {
    this._reactKey = reactKey
    this.post = v.post
    if (FeedPost.isRecord(this.post.record)) {
      const valid = FeedPost.validateRecord(this.post.record)
      if (valid.success) {
        this.postRecord = this.post.record
        this.richText = new RichText(
          this.postRecord.text,
          this.postRecord.entities,
          {cleanNewlines: true},
        )
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
    v: GetPostThread.ThreadViewPost,
    includeParent = true,
    includeChildren = true,
  ) {
    // parents
    if (includeParent && v.parent) {
      if (GetPostThread.isThreadViewPost(v.parent)) {
        const parentModel = new PostThreadViewPostModel(
          this.rootStore,
          keyGen.next().value,
          v.parent,
        )
        parentModel._depth = this._depth - 1
        if (v.parent.parent) {
          parentModel.assignTreeModels(keyGen, v.parent, true, false)
        }
        this.parent = parentModel
      } else if (GetPostThread.isNotFoundPost(v.parent)) {
        this.parent = v.parent
      }
    }
    // replies
    if (includeChildren && v.replies) {
      const replies = []
      for (const item of v.replies) {
        if (GetPostThread.isThreadViewPost(item)) {
          const itemModel = new PostThreadViewPostModel(
            this.rootStore,
            keyGen.next().value,
            item,
          )
          itemModel._depth = this._depth + 1
          if (item.replies) {
            itemModel.assignTreeModels(keyGen, item, false, true)
          }
          replies.push(itemModel)
        } else if (GetPostThread.isNotFoundPost(item)) {
          replies.push(item)
        }
      }
      this.replies = replies
    }
  }

  async toggleUpvote() {
    const wasUpvoted = !!this.post.viewer.upvote
    const wasDownvoted = !!this.post.viewer.downvote
    const res = await this.rootStore.api.app.bsky.feed.setVote({
      subject: {
        uri: this.post.uri,
        cid: this.post.cid,
      },
      direction: wasUpvoted ? 'none' : 'up',
    })
    runInAction(() => {
      if (wasDownvoted) {
        this.post.downvoteCount--
      }
      if (wasUpvoted) {
        this.post.upvoteCount--
      } else {
        this.post.upvoteCount++
      }
      this.post.viewer.upvote = res.data.upvote
      this.post.viewer.downvote = res.data.downvote
    })
  }

  async toggleDownvote() {
    const wasUpvoted = !!this.post.viewer.upvote
    const wasDownvoted = !!this.post.viewer.downvote
    const res = await this.rootStore.api.app.bsky.feed.setVote({
      subject: {
        uri: this.post.uri,
        cid: this.post.cid,
      },
      direction: wasDownvoted ? 'none' : 'down',
    })
    runInAction(() => {
      if (wasUpvoted) {
        this.post.upvoteCount--
      }
      if (wasDownvoted) {
        this.post.downvoteCount--
      } else {
        this.post.downvoteCount++
      }
      this.post.viewer.upvote = res.data.upvote
      this.post.viewer.downvote = res.data.downvote
    })
  }

  async toggleRepost() {
    if (this.post.viewer.repost) {
      await apilib.unrepost(this.rootStore, this.post.viewer.repost)
      runInAction(() => {
        this.post.repostCount--
        this.post.viewer.repost = undefined
      })
    } else {
      const res = await apilib.repost(
        this.rootStore,
        this.post.uri,
        this.post.cid,
      )
      runInAction(() => {
        this.post.repostCount++
        this.post.viewer.repost = res.uri
      })
    }
  }

  async delete() {
    await this.rootStore.api.app.bsky.feed.post.delete({
      did: this.post.author.did,
      rkey: new AtUri(this.post.uri).rkey,
    })
    this.rootStore.emitPostDeleted(this.post.uri)
  }
}

export class PostThreadViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  notFound = false
  resolvedUri = ''
  params: GetPostThread.QueryParams

  // data
  thread?: PostThreadViewPostModel

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

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
    this.notFound = false
  }

  private _xIdle(err?: any) {
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

  private async _resolveUri() {
    const urip = new AtUri(this.params.uri)
    if (!urip.host.startsWith('did:')) {
      try {
        urip.host = await apilib.resolveName(this.rootStore, urip.host)
      } catch (e: any) {
        this.error = e.toString()
      }
    }
    runInAction(() => {
      this.resolvedUri = urip.toString()
    })
  }

  private async _load(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.api.app.bsky.feed.getPostThread(
        Object.assign({}, this.params, {uri: this.resolvedUri}),
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private _replaceAll(res: GetPostThread.Response) {
    sortThread(res.data.thread)
    const keyGen = reactKeyGenerator()
    const thread = new PostThreadViewPostModel(
      this.rootStore,
      keyGen.next().value,
      res.data.thread as GetPostThread.ThreadViewPost,
    )
    thread._isHighlightedPost = true
    thread.assignTreeModels(
      keyGen,
      res.data.thread as GetPostThread.ThreadViewPost,
    )
    this.thread = thread
  }
}

type MaybePost =
  | GetPostThread.ThreadViewPost
  | GetPostThread.NotFoundPost
  | {[k: string]: unknown; $type: string}
function sortThread(post: MaybePost) {
  if (post.notFound) {
    return
  }
  post = post as GetPostThread.ThreadViewPost
  if (post.replies) {
    post.replies.sort((a: MaybePost, b: MaybePost) => {
      post = post as GetPostThread.ThreadViewPost
      if (a.notFound) {
        return 1
      }
      if (b.notFound) {
        return -1
      }
      a = a as GetPostThread.ThreadViewPost
      b = b as GetPostThread.ThreadViewPost
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

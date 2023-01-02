import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyFeedGetPostThread as GetPostThread} from '@atproto/api'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'

interface UnknownPost {
  $type: string
  [k: string]: unknown
}

function* reactKeyGenerator(): Generator<string> {
  let counter = 0
  while (true) {
    yield `item-${counter++}`
  }
}

function isThreadViewPost(
  v: GetPostThread.ThreadViewPost | GetPostThread.NotFoundPost | UnknownPost,
): v is GetPostThread.ThreadViewPost {
  return v.$type === 'app.bksy.feed.getPostThread#threadViewPost'
}
function isNotFoundPost(
  v: GetPostThread.ThreadViewPost | GetPostThread.NotFoundPost | UnknownPost,
): v is GetPostThread.NotFoundPost {
  return v.$type === 'app.bsky.feed.getPostThread#notFoundPost'
}

export class PostThreadViewPostModel {
  // ui state
  _reactKey: string = ''
  _depth = 0
  _isHighlightedPost = false
  _hasMore = false

  // data
  post: GetPostThread.ThreadViewPost['post']
  parent?: PostThreadViewPostModel | GetPostThread.NotFoundPost
  replies?: (PostThreadViewPostModel | GetPostThread.NotFoundPost)[]

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: GetPostThread.ThreadViewPost,
  ) {
    this._reactKey = reactKey
    this.post = v.post
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
      if (isThreadViewPost(v.parent)) {
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
      } else if (isNotFoundPost(v.parent)) {
        this.parent = v.parent
      }
    }
    // replies
    if (includeChildren && v.replies) {
      const replies = []
      for (const item of v.replies) {
        if (isThreadViewPost(item)) {
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
        } else if (isNotFoundPost(item)) {
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

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
    this.notFound = false
  }

  private _xIdle(err: any = undefined) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err ? err.toString() : ''
    this.notFound = err instanceof GetPostThread.NotFoundError
  }

  // loader functions
  // =

  private async _resolveUri() {
    const urip = new AtUri(this.params.uri)
    if (!urip.host.startsWith('did:')) {
      try {
        urip.host = await this.rootStore.resolveName(urip.host)
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
    // TODO: validate .record
    // sortThread(res.data.thread) TODO needed?
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

/*
TODO needed?
function sortThread(post: MaybePost) {
  if (post.notFound) {
    return
  }
  post = post as GetPostThread.Post
  if (post.replies) {
    post.replies.sort((a: MaybePost, b: MaybePost) => {
      post = post as GetPostThread.Post
      if (a.notFound) {
        return 1
      }
      if (b.notFound) {
        return -1
      }
      a = a as GetPostThread.Post
      b = b as GetPostThread.Post
      const aIsByOp = a.author.did === post.author.did
      const bIsByOp = b.author.did === post.author.did
      if (aIsByOp && bIsByOp) {
        return a.indexedAt.localeCompare(b.indexedAt) // oldest
      } else if (aIsByOp) {
        return -1 // op's own reply
      } else if (bIsByOp) {
        return 1 // op's own reply
      }
      return b.indexedAt.localeCompare(a.indexedAt) // newest
    })
    post.replies.forEach(reply => sortThread(reply))
  }
}
*/

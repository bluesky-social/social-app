import {makeAutoObservable, runInAction} from 'mobx'
import {bsky, AdxUri} from '@adxp/mock-api'
import _omit from 'lodash.omit'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'

function* reactKeyGenerator(): Generator<string> {
  let counter = 0
  while (true) {
    yield `item-${counter++}`
  }
}

export class PostThreadViewPostMyStateModel {
  hasLiked: boolean = false
  hasReposted: boolean = false

  constructor() {
    makeAutoObservable(this)
  }
}

export class PostThreadViewPostModel implements bsky.PostThreadView.Post {
  // ui state
  _reactKey: string = ''
  _depth = 0
  _isHighlightedPost = false

  // data
  uri: string = ''
  author: bsky.PostThreadView.User = {did: '', name: '', displayName: ''}
  record: Record<string, unknown> = {}
  embed?:
    | bsky.PostThreadView.RecordEmbed
    | bsky.PostThreadView.ExternalEmbed
    | bsky.PostThreadView.UnknownEmbed
  parent?: PostThreadViewPostModel
  replyCount: number = 0
  replies?: PostThreadViewPostModel[]
  repostCount: number = 0
  likeCount: number = 0
  indexedAt: string = ''
  myState = new PostThreadViewPostMyStateModel()

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v?: bsky.PostThreadView.Post,
  ) {
    makeAutoObservable(this, {rootStore: false})
    this._reactKey = reactKey
    if (v) {
      Object.assign(this, _omit(v, 'parent', 'replies', 'myState')) // replies and parent are handled via assignTreeModels
      if (v.myState) {
        Object.assign(this.myState, v.myState)
      }
    }
  }

  assignTreeModels(keyGen: Generator<string>, v: bsky.PostThreadView.Post) {
    // parents
    if (v.parent) {
      // TODO: validate .record
      const parentModel = new PostThreadViewPostModel(
        this.rootStore,
        keyGen.next().value,
        v.parent,
      )
      parentModel._depth = this._depth - 1
      if (v.parent.parent) {
        parentModel.assignTreeModels(keyGen, v.parent)
      }
      this.parent = parentModel
    }
    // replies
    if (v.replies) {
      const replies = []
      for (const item of v.replies) {
        // TODO: validate .record
        const itemModel = new PostThreadViewPostModel(
          this.rootStore,
          keyGen.next().value,
          item,
        )
        itemModel._depth = this._depth + 1
        if (item.replies) {
          itemModel.assignTreeModels(keyGen, item)
        }
        replies.push(itemModel)
      }
      this.replies = replies
    }
  }

  async toggleLike() {
    if (this.myState.hasLiked) {
      await apilib.unlike(this.rootStore.api, 'alice.com', this.uri)
      runInAction(() => {
        this.likeCount--
        this.myState.hasLiked = false
      })
    } else {
      await apilib.like(this.rootStore.api, 'alice.com', this.uri)
      runInAction(() => {
        this.likeCount++
        this.myState.hasLiked = true
      })
    }
  }

  async toggleRepost() {
    if (this.myState.hasReposted) {
      await apilib.unrepost(this.rootStore.api, 'alice.com', this.uri)
      runInAction(() => {
        this.repostCount--
        this.myState.hasReposted = false
      })
    } else {
      await apilib.repost(this.rootStore.api, 'alice.com', this.uri)
      runInAction(() => {
        this.repostCount++
        this.myState.hasReposted = true
      })
    }
  }
}

export class PostThreadViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  resolvedUri = ''
  params: bsky.PostThreadView.Params

  // data
  thread?: PostThreadViewPostModel

  constructor(
    public rootStore: RootStoreModel,
    params: bsky.PostThreadView.Params,
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
  }

  private _xIdle(err: string = '') {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err
  }

  // loader functions
  // =

  private async _resolveUri() {
    const urip = new AdxUri(this.params.uri)
    if (!urip.host.startsWith('did:')) {
      urip.host = await this.rootStore.resolveName(urip.host)
    }
    runInAction(() => {
      this.resolvedUri = urip.toString()
    })
  }

  private async _load(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = (await this.rootStore.api.mainPds.view(
        'blueskyweb.xyz:PostThreadView',
        Object.assign({}, this.params, {uri: this.resolvedUri}),
      )) as bsky.PostThreadView.Response
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load thread: ${e.toString()}`)
    }
  }

  private _replaceAll(res: bsky.PostThreadView.Response) {
    // TODO: validate .record
    const keyGen = reactKeyGenerator()
    const thread = new PostThreadViewPostModel(
      this.rootStore,
      keyGen.next().value,
      res.thread,
    )
    thread._isHighlightedPost = true
    thread.assignTreeModels(keyGen, res.thread)
    this.thread = thread
  }
}

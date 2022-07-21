import {makeAutoObservable, runInAction} from 'mobx'
import {bsky, AdxUri} from '@adxp/mock-api'
import _omit from 'lodash.omit'
import {RootStoreModel} from './root-store'

function* reactKeyGenerator(): Generator<string> {
  let counter = 0
  while (true) {
    yield `item-${counter++}`
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
  replyCount: number = 0
  replies?: PostThreadViewPostModel[]
  repostCount: number = 0
  likeCount: number = 0
  indexedAt: string = ''

  constructor(reactKey: string, v?: bsky.PostThreadView.Post) {
    makeAutoObservable(this)
    this._reactKey = reactKey
    if (v) {
      Object.assign(this, _omit(v, 'replies')) // copy everything but the replies
    }
  }

  setReplies(keyGen: Generator<string>, v: bsky.PostThreadView.Post) {
    if (v.replies) {
      const replies = []
      for (const item of v.replies) {
        // TODO: validate .record
        const itemModel = new PostThreadViewPostModel(keyGen.next().value, item)
        itemModel._depth = this._depth + 1
        if (item.replies) {
          itemModel.setReplies(keyGen, item)
        }
        replies.push(itemModel)
      }
      this.replies = replies
    }
  }
}
const UNLOADED_THREAD = new PostThreadViewPostModel('')

export class PostThreadViewModel implements bsky.PostThreadView.Response {
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  resolvedUri = ''
  params: bsky.PostThreadView.Params
  thread: PostThreadViewPostModel = UNLOADED_THREAD

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
    return this.thread !== UNLOADED_THREAD
  }

  get hasError() {
    return this.error !== ''
  }

  // public api
  // =

  async setup() {
    if (!this.resolvedUri) {
      await this._resolveUri()
    }
    if (this.hasContent) {
      await this._refresh()
    } else {
      await this._initialLoad()
    }
  }

  async refresh() {
    await this._refresh()
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

  private async _initialLoad() {
    this._xLoading()
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

  private async _refresh() {
    this._xLoading(true)
    // TODO: refetch and update items
    await new Promise(r => setTimeout(r, 1e3)) // DEBUG
    this._xIdle()
  }

  private _replaceAll(res: bsky.PostThreadView.Response) {
    // TODO: validate .record
    const keyGen = reactKeyGenerator()
    const thread = new PostThreadViewPostModel(keyGen.next().value, res.thread)
    thread._isHighlightedPost = true
    thread.setReplies(keyGen, res.thread)
    this.thread = thread
  }
}

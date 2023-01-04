import {makeAutoObservable, runInAction} from 'mobx'
import {AtUri} from '../../third-party/uri'
import {
  AppBskyFeedGetVotes as GetVotes,
  AppBskyActorRef as ActorRef,
} from '@atproto/api'
import {RootStoreModel} from './root-store'

export class VotesViewItemModel implements GetVotes.Vote {
  // ui state
  _reactKey: string = ''

  // data
  direction: 'up' | 'down' = 'up'
  indexedAt: string = ''
  createdAt: string = ''
  actor: ActorRef.WithInfo = {
    did: '',
    handle: '',
    declaration: {cid: '', actorType: ''},
  }

  constructor(reactKey: string, v: GetVotes.Vote) {
    makeAutoObservable(this)
    this._reactKey = reactKey
    Object.assign(this, v)
  }
}

export class VotesViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  resolvedUri = ''
  params: GetVotes.QueryParams

  // data
  uri: string = ''
  votes: VotesViewItemModel[] = []

  constructor(public rootStore: RootStoreModel, params: GetVotes.QueryParams) {
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
    return this.uri !== ''
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  async setup() {
    if (!this.resolvedUri) {
      await this._resolveUri()
    }
    await this._fetch()
  }

  async refresh() {
    await this._fetch(true)
  }

  async loadMore() {
    // TODO
  }

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err ? err.toString() : ''
    if (err) {
      this.rootStore.log.error('Failed to fetch votes', err)
    }
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

  private async _fetch(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.api.app.bsky.feed.getVotes(
        Object.assign({}, this.params, {uri: this.resolvedUri}),
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private _replaceAll(res: GetVotes.Response) {
    this.votes.length = 0
    let counter = 0
    for (const item of res.data.votes) {
      this._append(counter++, item)
    }
  }

  private _append(keyId: number, item: GetVotes.Vote) {
    this.votes.push(new VotesViewItemModel(`item-${keyId}`, item))
  }
}

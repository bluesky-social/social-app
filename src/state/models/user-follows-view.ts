import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetFollows as GetFollows,
  AppBskyActorRef as ActorRef,
} from '@atproto/api'
import {RootStoreModel} from './root-store'

export type FollowItem = GetFollows.Follow & {
  _reactKey: string
}

export class UserFollowsViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetFollows.QueryParams

  // data
  subject: ActorRef.WithInfo = {
    did: '',
    handle: '',
    declaration: {cid: '', actorType: ''},
  }
  follows: FollowItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetFollows.QueryParams,
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
    return this.subject.did !== ''
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
      this.rootStore.log.error('Failed to fetch user follows', err)
    }
  }

  // loader functions
  // =

  private async _fetch(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.api.app.bsky.graph.getFollows(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private _replaceAll(res: GetFollows.Response) {
    this.subject.did = res.data.subject.did
    this.subject.handle = res.data.subject.handle
    this.subject.displayName = res.data.subject.displayName
    this.subject.avatar = res.data.subject.avatar
    this.follows.length = 0
    let counter = 0
    for (const item of res.data.follows) {
      this._append({_reactKey: `item-${counter++}`, ...item})
    }
  }

  private _append(item: FollowItem) {
    this.follows.push(item)
  }
}

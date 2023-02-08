import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetFollows as GetFollows,
  AppBskyActorRef as ActorRef,
} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {cleanError} from '../../lib/strings'

const PAGE_SIZE = 30

export type FollowItem = GetFollows.Follow

export class UserFollowsViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetFollows.QueryParams
  hasMore = true
  loadMoreCursor?: string
  private _loadMorePromise: Promise<void> | undefined

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

  async refresh() {
    return this.loadMore(true)
  }

  async loadMore(isRefreshing = false) {
    if (this._loadMorePromise) {
      return this._loadMorePromise
    }
    this._loadMorePromise = this._load(isRefreshing)
    try {
      await this._loadMorePromise
    } finally {
      this._loadMorePromise = undefined
    }
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
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch user follows', err)
    }
  }

  // loader functions
  // =

  private async _load(replace = false) {
    if (!replace && !this.hasMore) {
      return
    }
    this._xLoading(replace)
    try {
      const params = Object.assign({}, this.params, {
        limit: PAGE_SIZE,
        before: replace ? undefined : this.loadMoreCursor,
      })
      const res = await this.rootStore.api.app.bsky.graph.getFollows(params)
      if (replace) {
        this._replaceAll(res)
      } else {
        this._appendAll(res)
      }
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private _replaceAll(res: GetFollows.Response) {
    this.follows = []
    this._appendAll(res)
  }

  private _appendAll(res: GetFollows.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.follows = this.follows.concat(res.data.follows)
  }
}

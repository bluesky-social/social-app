import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetFollowers as GetFollowers,
  AppBskyActorRef as ActorRef,
} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'

const PAGE_SIZE = 30

export type FollowerItem = ActorRef.WithInfo

export class UserFollowersViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetFollowers.QueryParams
  hasMore = true
  loadMoreCursor?: string

  // data
  subject: ActorRef.WithInfo = {
    did: '',
    handle: '',
    declaration: {cid: '', actorType: ''},
  }
  followers: FollowerItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetFollowers.QueryParams,
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

  loadMore = bundleAsync(async (replace: boolean = false) => {
    if (!replace && !this.hasMore) {
      return
    }
    this._xLoading(replace)
    try {
      const params = Object.assign({}, this.params, {
        limit: PAGE_SIZE,
        before: replace ? undefined : this.loadMoreCursor,
      })
      const res = await this.rootStore.api.app.bsky.graph.getFollowers(params)
      if (replace) {
        this._replaceAll(res)
      } else {
        this._appendAll(res)
      }
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  })

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
      this.rootStore.log.error('Failed to fetch user followers', err)
    }
  }

  // helper functions
  // =

  private _replaceAll(res: GetFollowers.Response) {
    this.followers = []
    this._appendAll(res)
  }

  private _appendAll(res: GetFollowers.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.followers = this.followers.concat(res.data.followers)
    this.rootStore.me.follows.hydrateProfiles(res.data.followers)
  }
}

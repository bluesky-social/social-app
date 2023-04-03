import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetFollows as GetFollows,
  AppBskyActorDefs as ActorDefs,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'

const PAGE_SIZE = 30

export type FollowItem = ActorDefs.ProfileViewBasic

export class UserFollowsModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetFollows.QueryParams
  hasMore = true
  loadMoreCursor?: string

  // data
  subject: ActorDefs.ProfileViewBasic = {
    did: '',
    handle: '',
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

  loadMore = bundleAsync(async (replace: boolean = false) => {
    if (!replace && !this.hasMore) {
      return
    }
    this._xLoading(replace)
    try {
      const params = Object.assign({}, this.params, {
        limit: PAGE_SIZE,
        cursor: replace ? undefined : this.loadMoreCursor,
      })
      const res = await this.rootStore.agent.getFollows(params)
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

  _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch user follows', err)
    }
  }

  // helper functions
  // =

  _replaceAll(res: GetFollows.Response) {
    this.follows = []
    this._appendAll(res)
  }

  _appendAll(res: GetFollows.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.follows = this.follows.concat(res.data.follows)
    this.rootStore.me.follows.hydrateProfiles(res.data.follows)
  }
}

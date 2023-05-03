import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetMutes as GetMutes,
  AppBskyActorDefs as ActorDefs,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'

const PAGE_SIZE = 30

export class MutedAccountsModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  hasMore = true
  loadMoreCursor?: string

  // data
  mutes: ActorDefs.ProfileView[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get hasContent() {
    return this.mutes.length > 0
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
      const res = await this.rootStore.agent.app.bsky.graph.getMutes({
        limit: PAGE_SIZE,
        cursor: replace ? undefined : this.loadMoreCursor,
      })
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
      this.rootStore.log.error('Failed to fetch user followers', err)
    }
  }

  // helper functions
  // =

  _replaceAll(res: GetMutes.Response) {
    this.mutes = []
    this._appendAll(res)
  }

  _appendAll(res: GetMutes.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.mutes = this.mutes.concat(res.data.mutes)
  }
}

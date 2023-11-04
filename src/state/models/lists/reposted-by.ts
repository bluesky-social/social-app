import {makeAutoObservable, runInAction} from 'mobx'
import {AtUri} from '@atproto/api'
import {
  AppBskyFeedGetRepostedBy as GetRepostedBy,
  AppBskyActorDefs,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'
import * as apilib from 'lib/api/index'

const PAGE_SIZE = 30

export type RepostedByItem = AppBskyActorDefs.ProfileViewBasic

export class RepostedByModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  resolvedUri = ''
  params: GetRepostedBy.QueryParams
  hasMore = true
  loadMoreCursor?: string

  // data
  uri: string = ''
  repostedBy: RepostedByItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetRepostedBy.QueryParams,
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

  async refresh() {
    return this.loadMore(true)
  }

  loadMore = bundleAsync(async (replace: boolean = false) => {
    this._xLoading(replace)
    try {
      if (!this.resolvedUri) {
        await this._resolveUri()
      }
      const params = Object.assign({}, this.params, {
        uri: this.resolvedUri,
        limit: PAGE_SIZE,
        cursor: replace ? undefined : this.loadMoreCursor,
      })
      const res = await this.rootStore.agent.getRepostedBy(params)
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
      this.rootStore.log.error('Failed to fetch reposted by view', {error: err})
    }
  }

  // helper functions
  // =

  async _resolveUri() {
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

  _replaceAll(res: GetRepostedBy.Response) {
    this.repostedBy = []
    this._appendAll(res)
  }

  _appendAll(res: GetRepostedBy.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.repostedBy = this.repostedBy.concat(res.data.repostedBy)
    this.rootStore.me.follows.hydrateMany(res.data.repostedBy)
  }
}

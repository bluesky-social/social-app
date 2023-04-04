import {makeAutoObservable, runInAction} from 'mobx'
import {AtUri} from '../../../third-party/uri'
import {AppBskyFeedGetLikes as GetLikes} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'
import * as apilib from 'lib/api/index'

const PAGE_SIZE = 30

export type LikeItem = GetLikes.Like

export class LikesModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  resolvedUri = ''
  params: GetLikes.QueryParams
  hasMore = true
  loadMoreCursor?: string

  // data
  uri: string = ''
  likes: LikeItem[] = []

  constructor(public rootStore: RootStoreModel, params: GetLikes.QueryParams) {
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
    if (!replace && !this.hasMore) {
      return
    }
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
      const res = await this.rootStore.agent.getLikes(params)
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
      this.rootStore.log.error('Failed to fetch likes', err)
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

  _replaceAll(res: GetLikes.Response) {
    this.likes = []
    this._appendAll(res)
  }

  _appendAll(res: GetLikes.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.rootStore.me.follows.hydrateProfiles(
      res.data.likes.map(like => like.actor),
    )
    this.likes = this.likes.concat(res.data.likes)
  }
}

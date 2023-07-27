import {makeAutoObservable} from 'mobx'
import {AppBskyUnspeccedGetPopularFeedGenerators} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'
import {CustomFeedModel} from '../feeds/custom-feed'

const DEFAULT_LIMIT = 50

export class FeedsDiscoveryModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  loadMoreCursor: string | undefined = undefined

  // data
  feeds: CustomFeedModel[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get hasMore() {
    if (this.loadMoreCursor) {
      return true
    }
    return false
  }

  get hasContent() {
    return this.feeds.length > 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  refresh = bundleAsync(async () => {
    this._xLoading()
    try {
      const res =
        await this.rootStore.agent.app.bsky.unspecced.getPopularFeedGenerators({
          limit: DEFAULT_LIMIT,
        })
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  })

  loadMore = bundleAsync(async () => {
    if (!this.hasMore) {
      return
    }
    this._xLoading()
    try {
      const res =
        await this.rootStore.agent.app.bsky.unspecced.getPopularFeedGenerators({
          limit: DEFAULT_LIMIT,
          cursor: this.loadMoreCursor,
        })
      this._append(res)
    } catch (e: any) {
      this._xIdle(e)
    }
    this._xIdle()
  })

  clear() {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = false
    this.error = ''
    this.feeds = []
  }

  // state transitions
  // =

  _xLoading() {
    this.isLoading = true
    this.isRefreshing = true
    this.error = ''
  }

  _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch popular feeds', err)
    }
  }

  // helper functions
  // =

  _replaceAll(res: AppBskyUnspeccedGetPopularFeedGenerators.Response) {
    // 1. set feeds data to empty array
    this.feeds = []
    // 2. call this._append()
    this._append(res)
  }

  _append(res: AppBskyUnspeccedGetPopularFeedGenerators.Response) {
    // 1. push data into feeds array
    for (const f of res.data.feeds) {
      this.feeds.push(new CustomFeedModel(this.rootStore, f))
    }
    // 2. set loadMoreCursor
    this.loadMoreCursor = res.data.cursor
  }
}

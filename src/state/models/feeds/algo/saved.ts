import {makeAutoObservable} from 'mobx'
import {AppBskyFeedGetSavedFeeds as GetSavedFeeds} from '@atproto/api'
import {RootStoreModel} from '../../root-store'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'
import {AlgoItemModel} from './algo-item'

const PAGE_SIZE = 30

export class SavedFeedsModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  hasMore = true
  loadMoreCursor?: string

  // data
  feeds: AlgoItemModel[] = []

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
    return this.feeds.length > 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  get numOfFeeds() {
    return this.feeds.length
  }

  get listOfFeedNames() {
    return this.feeds.map(
      f => f.data.displayName ?? f.data.creator.displayName + "'s feed",
    )
  }

  // public api
  // =

  async refresh() {
    return this.loadMore(true)
  }

  clear() {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = false
    this.error = ''
    this.hasMore = true
    this.loadMoreCursor = undefined
    this.feeds = []
  }

  loadMore = bundleAsync(async (replace: boolean = false) => {
    if (!replace && !this.hasMore) {
      return
    }
    this._xLoading(replace)
    try {
      const res = await this.rootStore.agent.app.bsky.feed.getSavedFeeds({
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

  _replaceAll(res: GetSavedFeeds.Response) {
    this.feeds = []
    this._appendAll(res)
  }

  _appendAll(res: GetSavedFeeds.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    for (const f of res.data.feeds) {
      this.feeds.push(new AlgoItemModel(this.rootStore, f))
    }
  }
}

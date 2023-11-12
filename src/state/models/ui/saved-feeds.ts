import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from '../root-store'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'
import {FeedSourceModel} from '../content/feed-source'
import {logger} from '#/logger'

export class SavedFeedsModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''

  // data
  all: FeedSourceModel[] = []

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
    return this.all.length > 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  get pinned(): FeedSourceModel[] {
    return this.rootStore.preferences.savedFeeds
      .filter(feed => this.rootStore.preferences.isPinnedFeed(feed))
      .map(uri => this.all.find(f => f.uri === uri))
      .filter(Boolean) as FeedSourceModel[]
  }

  get unpinned(): FeedSourceModel[] {
    return this.rootStore.preferences.savedFeeds
      .filter(feed => !this.rootStore.preferences.isPinnedFeed(feed))
      .map(uri => this.all.find(f => f.uri === uri))
      .filter(Boolean) as FeedSourceModel[]
  }

  get pinnedFeedNames() {
    return this.pinned.map(f => f.displayName)
  }

  // public api
  // =

  clear() {
    this.all = []
  }

  /**
   * Refresh the preferences then reload all feed infos
   */
  refresh = bundleAsync(async () => {
    this._xLoading(true)
    try {
      const uris = dedup(
        this.rootStore.preferences.pinnedFeeds.concat(
          this.rootStore.preferences.savedFeeds,
        ),
      )
      const feeds = uris.map(uri => new FeedSourceModel(this.rootStore, uri))
      await Promise.all(feeds.map(f => f.setup()))
      runInAction(() => {
        this.all = feeds
        this._updatePinSortOrder()
      })
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
      logger.error('Failed to fetch user feeds', {err})
    }
  }

  // helpers
  // =

  _updatePinSortOrder(order?: string[]) {
    order ??= this.rootStore.preferences.pinnedFeeds.concat(
      this.rootStore.preferences.savedFeeds,
    )
    this.all.sort((a, b) => {
      return order!.indexOf(a.uri) - order!.indexOf(b.uri)
    })
  }
}

function dedup(strings: string[]): string[] {
  return Array.from(new Set(strings))
}

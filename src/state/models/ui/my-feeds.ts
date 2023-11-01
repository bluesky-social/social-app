import {makeAutoObservable, reaction} from 'mobx'
import {SavedFeedsModel} from './saved-feeds'
import {FeedsDiscoveryModel} from '../discovery/feeds'
import {FeedSourceModel} from '../content/feed-source'
import {RootStoreModel} from '../root-store'

export type MyFeedsItem =
  | {
      _reactKey: string
      type: 'spinner'
    }
  | {
      _reactKey: string
      type: 'saved-feeds-loading'
      numItems: number
    }
  | {
      _reactKey: string
      type: 'discover-feeds-loading'
    }
  | {
      _reactKey: string
      type: 'error'
      error: string
    }
  | {
      _reactKey: string
      type: 'saved-feeds-header'
    }
  | {
      _reactKey: string
      type: 'saved-feed'
      feed: FeedSourceModel
    }
  | {
      _reactKey: string
      type: 'saved-feeds-load-more'
    }
  | {
      _reactKey: string
      type: 'discover-feeds-header'
    }
  | {
      _reactKey: string
      type: 'discover-feeds-no-results'
    }
  | {
      _reactKey: string
      type: 'discover-feed'
      feed: FeedSourceModel
    }

export class MyFeedsUIModel {
  saved: SavedFeedsModel
  discovery: FeedsDiscoveryModel

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this)
    this.saved = new SavedFeedsModel(this.rootStore)
    this.discovery = new FeedsDiscoveryModel(this.rootStore)
  }

  get isRefreshing() {
    return !this.saved.isLoading && this.saved.isRefreshing
  }

  get isLoading() {
    return this.saved.isLoading || this.discovery.isLoading
  }

  async setup() {
    if (!this.saved.hasLoaded) {
      await this.saved.refresh()
    }
    if (!this.discovery.hasLoaded) {
      await this.discovery.refresh()
    }
  }

  registerListeners() {
    const dispose1 = reaction(
      () => this.rootStore.preferences.savedFeeds,
      () => this.saved.refresh(),
    )
    const dispose2 = reaction(
      () => this.rootStore.preferences.pinnedFeeds,
      () => this.saved.refresh(),
    )
    return () => {
      dispose1()
      dispose2()
    }
  }

  async refresh() {
    return Promise.all([this.saved.refresh(), this.discovery.refresh()])
  }

  async loadMore() {
    return this.discovery.loadMore()
  }

  get items() {
    let items: MyFeedsItem[] = []

    items.push({
      _reactKey: '__saved_feeds_header__',
      type: 'saved-feeds-header',
    })
    if (this.saved.isLoading) {
      items.push({
        _reactKey: '__saved_feeds_loading__',
        type: 'saved-feeds-loading',
        numItems: this.rootStore.preferences.savedFeeds.length || 3,
      })
    } else if (this.saved.hasError) {
      items.push({
        _reactKey: '__saved_feeds_error__',
        type: 'error',
        error: this.saved.error,
      })
    } else {
      const savedSorted = this.saved.all
        .slice()
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
      items = items.concat(
        savedSorted.map(feed => ({
          _reactKey: `saved-${feed.uri}`,
          type: 'saved-feed',
          feed,
        })),
      )
      items.push({
        _reactKey: '__saved_feeds_load_more__',
        type: 'saved-feeds-load-more',
      })
    }

    items.push({
      _reactKey: '__discover_feeds_header__',
      type: 'discover-feeds-header',
    })
    if (this.discovery.isLoading && !this.discovery.hasContent) {
      items.push({
        _reactKey: '__discover_feeds_loading__',
        type: 'discover-feeds-loading',
      })
    } else if (this.discovery.hasError) {
      items.push({
        _reactKey: '__discover_feeds_error__',
        type: 'error',
        error: this.discovery.error,
      })
    } else if (this.discovery.isEmpty) {
      items.push({
        _reactKey: '__discover_feeds_no_results__',
        type: 'discover-feeds-no-results',
      })
    } else {
      items = items.concat(
        this.discovery.feeds.map(feed => ({
          _reactKey: `discover-${feed.uri}`,
          type: 'discover-feed',
          feed,
        })),
      )
      if (this.discovery.isLoading) {
        items.push({
          _reactKey: '__discover_feeds_loading_more__',
          type: 'spinner',
        })
      }
    }

    return items
  }
}

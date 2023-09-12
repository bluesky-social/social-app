import {makeAutoObservable} from 'mobx'
import {FeedsDiscoveryModel} from '../discovery/feeds'
import {CustomFeedModel} from '../feeds/custom-feed'
import {RootStoreModel} from '../root-store'

export type MyFeedsItem =
  | {
      _reactKey: string
      type: 'loading'
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
      feed: CustomFeedModel
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
      type: 'discover-feed'
      feed: CustomFeedModel
    }

export class MyFeedsUIModel {
  discovery = new FeedsDiscoveryModel(this.rootStore)

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this)
  }

  get saved() {
    return this.rootStore.me.savedFeeds
  }

  get isRefreshing() {
    return this.saved.isRefreshing
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

  get items() {
    let items: MyFeedsItem[] = []

    items.push({
      _reactKey: '__saved_feeds_header__',
      type: 'saved-feeds-header',
    })
    if (this.saved.isLoading) {
      items.push({_reactKey: '__saved_feeds_loading__', type: 'loading'})
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
    if (this.discovery.isLoading) {
      items.push({_reactKey: '__discover_feeds_loading__', type: 'loading'})
    } else if (this.discovery.hasError) {
      items.push({
        _reactKey: '__discover_feeds_error__',
        type: 'error',
        error: this.discovery.error,
      })
    } else {
      items = items.concat(
        this.discovery.feeds.map(feed => ({
          _reactKey: `discover-${feed.uri}`,
          type: 'discover-feed',
          feed,
        })),
      )
    }

    return items
  }
}

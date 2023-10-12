import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from '../root-store'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'
import {CustomFeedModel} from '../feeds/custom-feed'
import {track} from 'lib/analytics/analytics'

export class SavedFeedsModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''

  // data
  all: CustomFeedModel[] = []

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

  get pinned() {
    return this.all.filter(feed => feed.isPinned)
  }

  get unpinned() {
    return this.all.filter(feed => !feed.isPinned)
  }

  get pinnedFeedNames() {
    return this.pinned.map(f => f.displayName)
  }

  // public api
  // =

  /**
   * Refresh the preferences then reload all feed infos
   */
  refresh = bundleAsync(async () => {
    this._xLoading(true)
    try {
      await this.rootStore.preferences.sync()
      const uris = this.rootStore.preferences.savedFeeds
      const feeds: CustomFeedModel[] = []
      for (let i = 0; i < uris.length; i += 25) {
        const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerators({
          feeds: uris.slice(i, 25),
        })
        for (const info of res.data.feeds) {
          feeds.push(new CustomFeedModel(this.rootStore, info))
        }
      }
      runInAction(() => {
        this.all = feeds
      })
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  })

  async reorderPinnedFeeds(feeds: CustomFeedModel[]) {
    return this.rootStore.preferences.setSavedFeeds(
      this.rootStore.preferences.savedFeeds,
      feeds.filter(feed => feed.isPinned).map(feed => feed.uri),
    )
  }

  async movePinnedFeed(item: CustomFeedModel, direction: 'up' | 'down') {
    const pinned = this.rootStore.preferences.pinnedFeeds.slice()
    const index = pinned.indexOf(item.uri)
    if (index === -1) {
      return
    }
    if (direction === 'up' && index !== 0) {
      const temp = pinned[index]
      pinned[index] = pinned[index - 1]
      pinned[index - 1] = temp
    } else if (direction === 'down' && index < pinned.length - 1) {
      const temp = pinned[index]
      pinned[index] = pinned[index + 1]
      pinned[index + 1] = temp
    }
    await this.rootStore.preferences.setSavedFeeds(
      this.rootStore.preferences.savedFeeds,
      pinned,
    )
    track('CustomFeed:Reorder', {
      name: item.data.displayName,
      uri: item.uri,
      index: pinned.indexOf(item.uri),
    })
  }

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
      this.rootStore.log.error('Failed to fetch user feeds', err)
    }
  }
}

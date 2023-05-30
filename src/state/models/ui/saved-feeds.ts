import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyFeedDefs} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'
import {CustomFeedModel} from '../feeds/custom-feed'

export class SavedFeedsModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''

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

  get hasContent() {
    return this.feeds.length > 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  get pinned() {
    return this.rootStore.preferences.pinnedFeeds
      .map(uri => this.feeds.find(f => f.uri === uri) as CustomFeedModel)
      .filter(Boolean)
  }

  get unpinned() {
    return this.feeds.filter(f => !this.isPinned(f))
  }

  get all() {
    return this.pinned.concat(this.unpinned)
  }

  get pinnedFeedNames() {
    return this.pinned.map(f => f.displayName)
  }

  // public api
  // =

  clear() {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = false
    this.error = ''
    this.feeds = []
  }

  refresh = bundleAsync(async (quietRefresh = false) => {
    this._xLoading(!quietRefresh)
    try {
      let feeds: AppBskyFeedDefs.GeneratorView[] = []
      for (
        let i = 0;
        i < this.rootStore.preferences.savedFeeds.length;
        i += 25
      ) {
        const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerators({
          feeds: this.rootStore.preferences.savedFeeds.slice(i, 25),
        })
        feeds = feeds.concat(res.data.feeds)
      }
      runInAction(() => {
        this.feeds = feeds.map(f => new CustomFeedModel(this.rootStore, f))
      })
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  })

  async save(feed: CustomFeedModel) {
    try {
      await feed.save()
      runInAction(() => {
        this.feeds = [
          ...this.feeds,
          new CustomFeedModel(this.rootStore, feed.data),
        ]
      })
    } catch (e: any) {
      this.rootStore.log.error('Failed to save feed', e)
    }
  }

  async unsave(feed: CustomFeedModel) {
    const uri = feed.uri
    try {
      if (this.isPinned(feed)) {
        await this.rootStore.preferences.removePinnedFeed(uri)
      }
      await feed.unsave()
      runInAction(() => {
        this.feeds = this.feeds.filter(f => f.data.uri !== uri)
      })
    } catch (e: any) {
      this.rootStore.log.error('Failed to unsave feed', e)
    }
  }

  async togglePinnedFeed(feed: CustomFeedModel) {
    if (!this.isPinned(feed)) {
      return this.rootStore.preferences.addPinnedFeed(feed.uri)
    } else {
      return this.rootStore.preferences.removePinnedFeed(feed.uri)
    }
  }

  async reorderPinnedFeeds(feeds: CustomFeedModel[]) {
    return this.rootStore.preferences.setSavedFeeds(
      this.rootStore.preferences.savedFeeds,
      feeds.filter(feed => this.isPinned(feed)).map(feed => feed.uri),
    )
  }

  isPinned(feedOrUri: CustomFeedModel | string) {
    let uri: string
    if (typeof feedOrUri === 'string') {
      uri = feedOrUri
    } else {
      uri = feedOrUri.uri
    }
    return this.rootStore.preferences.pinnedFeeds.includes(uri)
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

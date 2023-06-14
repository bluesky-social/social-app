import {makeAutoObservable, runInAction} from 'mobx'
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
  _feedModelCache: Record<string, CustomFeedModel> = {}

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
    return this.rootStore.preferences.pinnedFeeds
      .map(uri => this._feedModelCache[uri] as CustomFeedModel)
      .filter(Boolean)
  }

  get unpinned() {
    return this.rootStore.preferences.savedFeeds
      .filter(uri => !this.isPinned(uri))
      .map(uri => this._feedModelCache[uri] as CustomFeedModel)
      .filter(Boolean)
  }

  get all() {
    return [...this.pinned, ...this.unpinned]
  }

  get pinnedFeedNames() {
    return this.pinned.map(f => f.displayName)
  }

  // public api
  // =

  /**
   * Syncs the cached models against the current state
   * - Should only be called by the preferences model after syncing state
   */
  updateCache = bundleAsync(async (clearCache?: boolean) => {
    let newFeedModels: Record<string, CustomFeedModel> = {}
    if (!clearCache) {
      newFeedModels = {...this._feedModelCache}
    }

    // collect the feed URIs that havent been synced yet
    const neededFeedUris = []
    for (const feedUri of this.rootStore.preferences.savedFeeds) {
      if (!(feedUri in newFeedModels)) {
        neededFeedUris.push(feedUri)
      }
    }

    // early exit if no feeds need to be fetched
    if (!neededFeedUris.length || neededFeedUris.length === 0) {
      return
    }

    // fetch the missing models
    try {
      for (let i = 0; i < neededFeedUris.length; i += 25) {
        const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerators({
          feeds: neededFeedUris.slice(i, 25),
        })
        for (const feedInfo of res.data.feeds) {
          newFeedModels[feedInfo.uri] = new CustomFeedModel(
            this.rootStore,
            feedInfo,
          )
        }
      }
    } catch (error) {
      console.error('Failed to fetch feed models', error)
      this.rootStore.log.error('Failed to fetch feed models', error)
    }

    // merge into the cache
    runInAction(() => {
      this._feedModelCache = newFeedModels
    })
  })

  /**
   * Refresh the preferences then reload all feed infos
   */
  refresh = bundleAsync(async () => {
    this._xLoading(true)
    try {
      await this.rootStore.preferences.sync({clearCache: true})
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  })

  async save(feed: CustomFeedModel) {
    try {
      await feed.save()
      await this.updateCache()
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

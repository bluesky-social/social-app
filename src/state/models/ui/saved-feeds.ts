import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyFeedGetSavedFeeds as GetSavedFeeds} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'
import {CustomFeedModel} from '../feeds/custom-feed'
import {hasProp, isObj} from 'lib/type-guards'

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
  feeds: CustomFeedModel[] = []
  pinned: CustomFeedModel[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  serialize() {
    return {
      pinned: this.pinned.map(f => f.serialize()),
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'pinned')) {
        const pinnedSerialized = (v as any).pinned as string[]
        const pinnedDeserialized = pinnedSerialized.map(
          (s: string) => new CustomFeedModel(this.rootStore, JSON.parse(s)),
        )
        this.pinned = pinnedDeserialized
      }
    }
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

  get numFeeds() {
    return this.feeds.length
  }

  get unpinned() {
    return this.feeds.filter(
      f => !this.pinned.find(p => p.data.uri === f.data.uri),
    )
  }

  get feedNames() {
    return this.feeds.map(f => f.displayName)
  }

  get pinnedFeedNames() {
    return this.pinned.map(f => f.displayName)
  }

  togglePinnedFeed(feed: CustomFeedModel) {
    if (!this.isPinned(feed)) {
      this.pinned = [...this.pinned, feed]
    } else {
      this.removePinnedFeed(feed.data.uri)
    }
  }

  removePinnedFeed(uri: string) {
    this.pinned = this.pinned.filter(f => f.data.uri !== uri)
  }

  reorderPinnedFeeds(temp: CustomFeedModel[]) {
    this.pinned = temp.filter(item => this.isPinned(item))
  }

  isPinned(feed: CustomFeedModel) {
    return this.pinned.find(f => f.data.uri === feed.data.uri) ? true : false
  }

  movePinnedItem(item: CustomFeedModel, direction: 'up' | 'down') {
    if (this.pinned.length < 2) {
      throw new Error('Array must have at least 2 items')
    }
    const index = this.pinned.indexOf(item)
    if (index === -1) {
      throw new Error('Item not found in array')
    }

    const len = this.pinned.length

    runInAction(() => {
      if (direction === 'up') {
        if (index === 0) {
          // Remove the item from the first place and put it at the end
          this.pinned.push(this.pinned.shift()!)
        } else {
          // Swap the item with the one before it
          const temp = this.pinned[index]
          this.pinned[index] = this.pinned[index - 1]
          this.pinned[index - 1] = temp
        }
      } else if (direction === 'down') {
        if (index === len - 1) {
          // Remove the item from the last place and put it at the start
          this.pinned.unshift(this.pinned.pop()!)
        } else {
          // Swap the item with the one after it
          const temp = this.pinned[index]
          this.pinned[index] = this.pinned[index + 1]
          this.pinned[index + 1] = temp
        }
      }
      // this.pinned = [...this.pinned]
    })
  }

  // public api
  // =

  async refresh(quietRefresh = false) {
    return this.loadMore(true, quietRefresh)
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

  loadMore = bundleAsync(
    async (replace: boolean = false, quietRefresh = false) => {
      if (!replace && !this.hasMore) {
        return
      }
      this._xLoading(replace && !quietRefresh)
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
    },
  )

  removeFeed(uri: string) {
    this.feeds = this.feeds.filter(f => f.data.uri !== uri)
  }

  addFeed(algoItem: CustomFeedModel) {
    this.feeds.push(new CustomFeedModel(this.rootStore, algoItem.data))
  }

  async save(algoItem: CustomFeedModel) {
    try {
      await algoItem.save()
      this.addFeed(algoItem)
    } catch (e: any) {
      this.rootStore.log.error('Failed to save feed', e)
    }
  }

  async unsave(algoItem: CustomFeedModel) {
    const uri = algoItem.uri
    try {
      await algoItem.unsave()
      this.removeFeed(uri)
      this.removePinnedFeed(uri)
    } catch (e: any) {
      this.rootStore.log.error('Failed to unsave feed', e)
    }
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
      this.feeds.push(new CustomFeedModel(this.rootStore, f))
    }
  }
}

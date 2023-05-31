import {makeAutoObservable, runInAction} from 'mobx'
import {AtUri} from '@atproto/api'
import {bundleAsync} from 'lib/async/bundle'
import {RootStoreModel} from '../root-store'
import {CustomFeedModel} from './custom-feed'
import {PostsFeedModel} from './posts'
import {PostsFeedSliceModel} from './post'

const FEED_PAGE_SIZE = 5
const FEEDS_PAGE_SIZE = 3

export type MultiFeedItem =
  | {
      _reactKey: string
      type: 'header'
    }
  | {
      _reactKey: string
      type: 'feed-header'
      avatar: string | undefined
      title: string
    }
  | {
      _reactKey: string
      type: 'feed-slice'
      slice: PostsFeedSliceModel
    }
  | {
      _reactKey: string
      type: 'feed-loading'
    }
  | {
      _reactKey: string
      type: 'feed-error'
      error: string
    }
  | {
      _reactKey: string
      type: 'feed-footer'
      title: string
      uri: string
    }
  | {
      _reactKey: string
      type: 'footer'
    }

export class PostsMultiFeedModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  hasMore = true

  // data
  feedInfos: CustomFeedModel[] = []
  feeds: PostsFeedModel[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }

  get hasContent() {
    return this.feeds.length !== 0
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  get items() {
    const items: MultiFeedItem[] = [{_reactKey: '__header__', type: 'header'}]
    for (let i = 0; i < this.feedInfos.length; i++) {
      if (!this.feeds[i]) {
        break
      }
      const feed = this.feeds[i]
      const feedInfo = this.feedInfos[i]
      const urip = new AtUri(feedInfo.uri)
      items.push({
        _reactKey: `__feed_header_${i}__`,
        type: 'feed-header',
        avatar: feedInfo.data.avatar,
        title: feedInfo.displayName,
      })
      if (feed.isLoading) {
        items.push({
          _reactKey: `__feed_loading_${i}__`,
          type: 'feed-loading',
        })
      } else if (feed.hasError) {
        items.push({
          _reactKey: `__feed_error_${i}__`,
          type: 'feed-error',
          error: feed.error,
        })
      } else {
        for (let j = 0; j < feed.slices.length; j++) {
          items.push({
            _reactKey: `__feed_slice_${i}_${j}__`,
            type: 'feed-slice',
            slice: feed.slices[j],
          })
        }
      }
      items.push({
        _reactKey: `__feed_footer_${i}__`,
        type: 'feed-footer',
        title: feedInfo.displayName,
        uri: `/profile/${feedInfo.data.creator.did}/feed/${urip.rkey}`,
      })
    }
    if (!this.hasMore) {
      items.push({_reactKey: '__footer__', type: 'footer'})
    }
    return items
  }

  // public api
  // =

  /**
   * Nuke all data
   */
  clear() {
    this.rootStore.log.debug('MultiFeedModel:clear')
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = false
    this.hasMore = true
    this.feeds = []
  }

  /**
   * Register any event listeners. Returns a cleanup function.
   */
  registerListeners() {
    const sub = this.rootStore.onPostDeleted(this.onPostDeleted.bind(this))
    return () => sub.remove()
  }

  /**
   * Reset and load
   */
  async refresh() {
    this.feedInfos = this.rootStore.me.savedFeeds.all.slice() // capture current feeds
    await this.loadMore(true)
  }

  /**
   * Load more posts to the end of the feed
   */
  loadMore = bundleAsync(async (isRefreshing: boolean = false) => {
    if (!isRefreshing && !this.hasMore) {
      return
    }
    if (isRefreshing) {
      this.isRefreshing = true // set optimistically for UI
      this.feeds = []
    }
    this._xLoading(isRefreshing)
    const start = this.feeds.length
    const newFeeds: PostsFeedModel[] = []
    for (
      let i = start;
      i < start + FEEDS_PAGE_SIZE && i < this.feedInfos.length;
      i++
    ) {
      const feed = new PostsFeedModel(this.rootStore, 'custom', {
        feed: this.feedInfos[i].uri,
      })
      feed.pageSize = FEED_PAGE_SIZE
      await feed.setup()
      newFeeds.push(feed)
    }
    runInAction(() => {
      this.feeds = this.feeds.concat(newFeeds)
      this.hasMore = this.feeds.length < this.feedInfos.length
    })
    this._xIdle()
  })

  /**
   * Attempt to load more again after a failure
   */
  async retryLoadMore() {
    this.hasMore = true
    return this.loadMore()
  }

  /**
   * Removes posts from the feed upon deletion.
   */
  onPostDeleted(uri: string) {
    for (const f of this.feeds) {
      f.onPostDeleted(uri)
    }
  }

  // state transitions
  // =

  _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
  }

  _xIdle() {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
  }

  // helper functions
  // =
}

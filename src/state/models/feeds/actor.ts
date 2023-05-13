import {makeAutoObservable} from 'mobx'
import {
  AppBskyFeedGetBookmarkedFeeds as GetBookmarkedFeeds,
  // AppBskyFeedBookmarkFeed as bookmarkedFeed,
  // AppBskyFeedUnbookmarkFeed as unbookmarkFeed,
  AppBskyFeedDefs as FeedDefs,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'

const PAGE_SIZE = 30

export class BookmarkedFeedsModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  hasMore = true
  loadMoreCursor?: string

  // data
  feeds: FeedDefs.GeneratorView[] = []

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
      const res = await this.rootStore.agent.app.bsky.feed.getActorFeeds({
        actor: 'did:plc:dpny6d4qwwxu5b6dp3qob5ok', // TODO: take this as input param
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

  async bookmark(feed: FeedDefs.GeneratorView) {
    try {
      await this.rootStore.agent.app.bsky.feed.bookmarkFeed({feed: feed.uri})
    } catch (e: any) {
      this.rootStore.log.error('Failed to bookmark feed', e)
    }
  }

  async unbookmark(feed: FeedDefs.GeneratorView) {
    try {
      await this.rootStore.agent.app.bsky.feed.unbookmarkFeed({feed: feed.uri})
    } catch (e: any) {
      this.rootStore.log.error('Failed to unbookmark feed', e)
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

  _replaceAll(res: GetBookmarkedFeeds.Response) {
    this.feeds = []
    this._appendAll(res)
  }

  _appendAll(res: GetBookmarkedFeeds.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.feeds = this.feeds.concat(res.data.feeds)
  }
}

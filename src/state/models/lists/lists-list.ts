import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetLists as GetLists,
  AppBskyGraphGetListBlocks as GetListBlocks,
  AppBskyGraphDefs as GraphDefs,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'

const PAGE_SIZE = 30

export class ListsListModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  loadMoreError = ''
  hasMore = true
  loadMoreCursor?: string

  // data
  lists: GraphDefs.ListView[] = []

  constructor(
    public rootStore: RootStoreModel,
    public source: 'mutelists' | string,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get hasContent() {
    return this.lists.length > 0
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

  loadMore = bundleAsync(async (replace: boolean = false) => {
    if (!replace && !this.hasMore) {
      return
    }
    this._xLoading(replace)
    try {
      let res
      if (this.source === 'mutelists') {
        res = await this.rootStore.agent.app.bsky.graph.getListBlocks({
          limit: PAGE_SIZE,
          cursor: replace ? undefined : this.loadMoreCursor,
        })
      } else {
        res = await this.rootStore.agent.app.bsky.graph.getLists({
          actor: this.source,
          limit: PAGE_SIZE,
          cursor: replace ? undefined : this.loadMoreCursor,
        })
      }
      if (replace) {
        this._replaceAll(res)
      } else {
        this._appendAll(res)
      }
      this._xIdle()
    } catch (e: any) {
      this._xIdle(replace ?? e, !replace ?? e)
    }
  })

  /**
   * Attempt to load more again after a failure
   */
  async retryLoadMore() {
    this.loadMoreError = ''
    this.hasMore = true
    return this.loadMore()
  }

  // state transitions
  // =

  _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  _xIdle(err?: any, loadMoreErr?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(err)
    this.loadMoreError = cleanError(loadMoreErr)
    if (err) {
      this.rootStore.log.error('Failed to fetch user lists', err)
    }
    if (loadMoreErr) {
      this.rootStore.log.error('Failed to fetch user lists', loadMoreErr)
    }
  }

  // helper functions
  // =

  _replaceAll(res: GetLists.Response | GetListBlocks.Response) {
    this.lists = []
    this._appendAll(res)
  }

  _appendAll(res: GetLists.Response | GetListBlocks.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.lists = this.lists.concat(res.data.lists)
  }
}

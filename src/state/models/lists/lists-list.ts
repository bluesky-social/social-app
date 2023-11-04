import {makeAutoObservable} from 'mobx'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'
import {accumulate} from 'lib/async/accumulate'
import {logger} from '#/logger'

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
    public source: 'mine' | 'my-curatelists' | 'my-modlists' | string,
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

  get curatelists() {
    return this.lists.filter(
      list => list.purpose === 'app.bsky.graph.defs#curatelist',
    )
  }

  get isCuratelistsEmpty() {
    return this.hasLoaded && this.curatelists.length === 0
  }

  get modlists() {
    return this.lists.filter(
      list => list.purpose === 'app.bsky.graph.defs#modlist',
    )
  }

  get isModlistsEmpty() {
    return this.hasLoaded && this.modlists.length === 0
  }

  /**
   * Removes posts from the feed upon deletion.
   */
  onListDeleted(uri: string) {
    this.lists = this.lists.filter(l => l.uri !== uri)
  }

  // public api
  // =

  /**
   * Register any event listeners. Returns a cleanup function.
   */
  registerListeners() {
    const sub = this.rootStore.onListDeleted(this.onListDeleted.bind(this))
    return () => sub.remove()
  }

  async refresh() {
    return this.loadMore(true)
  }

  loadMore = bundleAsync(async (replace: boolean = false) => {
    if (!replace && !this.hasMore) {
      return
    }
    this._xLoading(replace)
    try {
      let cursor: string | undefined
      let lists: GraphDefs.ListView[] = []
      if (
        this.source === 'mine' ||
        this.source === 'my-curatelists' ||
        this.source === 'my-modlists'
      ) {
        const promises = [
          accumulate(cursor =>
            this.rootStore.agent.app.bsky.graph
              .getLists({
                actor: this.rootStore.me.did,
                cursor,
                limit: 50,
              })
              .then(res => ({cursor: res.data.cursor, items: res.data.lists})),
          ),
        ]
        if (this.source === 'my-modlists') {
          promises.push(
            accumulate(cursor =>
              this.rootStore.agent.app.bsky.graph
                .getListMutes({
                  cursor,
                  limit: 50,
                })
                .then(res => ({
                  cursor: res.data.cursor,
                  items: res.data.lists,
                })),
            ),
          )
          promises.push(
            accumulate(cursor =>
              this.rootStore.agent.app.bsky.graph
                .getListBlocks({
                  cursor,
                  limit: 50,
                })
                .then(res => ({
                  cursor: res.data.cursor,
                  items: res.data.lists,
                })),
            ),
          )
        }
        const resultset = await Promise.all(promises)
        for (const res of resultset) {
          for (let list of res) {
            if (
              this.source === 'my-curatelists' &&
              list.purpose !== 'app.bsky.graph.defs#curatelist'
            ) {
              continue
            }
            if (
              this.source === 'my-modlists' &&
              list.purpose !== 'app.bsky.graph.defs#modlist'
            ) {
              continue
            }
            if (!lists.find(l => l.uri === list.uri)) {
              lists.push(list)
            }
          }
        }
      } else {
        const res = await this.rootStore.agent.app.bsky.graph.getLists({
          actor: this.source,
          limit: PAGE_SIZE,
          cursor: replace ? undefined : this.loadMoreCursor,
        })
        lists = res.data.lists
        cursor = res.data.cursor
      }
      if (replace) {
        this._replaceAll({lists, cursor})
      } else {
        this._appendAll({lists, cursor})
      }
      this._xIdle()
    } catch (e: any) {
      this._xIdle(replace ? e : undefined, !replace ? e : undefined)
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
      logger.error('Failed to fetch user lists', {error: err})
    }
    if (loadMoreErr) {
      logger.error('Failed to fetch user lists', {
        error: loadMoreErr,
      })
    }
  }

  // helper functions
  // =

  _replaceAll({
    lists,
    cursor,
  }: {
    lists: GraphDefs.ListView[]
    cursor: string | undefined
  }) {
    this.lists = []
    this._appendAll({lists, cursor})
  }

  _appendAll({
    lists,
    cursor,
  }: {
    lists: GraphDefs.ListView[]
    cursor: string | undefined
  }) {
    this.loadMoreCursor = cursor
    this.hasMore = !!this.loadMoreCursor
    this.lists = this.lists.concat(
      lists.map(list => ({...list, _reactKey: list.uri})),
    )
  }
}

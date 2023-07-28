import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetLists as GetLists,
  AppBskyGraphGetListMutes as GetListMutes,
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
    public source: 'my-modlists' | string,
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
      let res: GetLists.Response
      if (this.source === 'my-modlists') {
        res = {
          success: true,
          headers: {},
          data: {
            subject: undefined,
            lists: [],
          },
        }
        const [res1, res2] = await Promise.all([
          fetchAllUserLists(this.rootStore, this.rootStore.me.did),
          fetchAllMyMuteLists(this.rootStore),
        ])
        for (let list of res1.data.lists) {
          if (list.purpose === 'app.bsky.graph.defs#modlist') {
            res.data.lists.push(list)
          }
        }
        for (let list of res2.data.lists) {
          if (
            list.purpose === 'app.bsky.graph.defs#modlist' &&
            !res.data.lists.find(l => l.uri === list.uri)
          ) {
            res.data.lists.push(list)
          }
        }
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
      this.rootStore.log.error('Failed to fetch user lists', err)
    }
    if (loadMoreErr) {
      this.rootStore.log.error('Failed to fetch user lists', loadMoreErr)
    }
  }

  // helper functions
  // =

  _replaceAll(res: GetLists.Response | GetListMutes.Response) {
    this.lists = []
    this._appendAll(res)
  }

  _appendAll(res: GetLists.Response | GetListMutes.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.lists = this.lists.concat(
      res.data.lists.map(list => ({...list, _reactKey: list.uri})),
    )
  }
}

async function fetchAllUserLists(
  store: RootStoreModel,
  did: string,
): Promise<GetLists.Response> {
  let acc: GetLists.Response = {
    success: true,
    headers: {},
    data: {
      subject: undefined,
      lists: [],
    },
  }

  let cursor
  for (let i = 0; i < 100; i++) {
    const res: GetLists.Response = await store.agent.app.bsky.graph.getLists({
      actor: did,
      cursor,
      limit: 50,
    })
    cursor = res.data.cursor
    acc.data.lists = acc.data.lists.concat(res.data.lists)
    if (!cursor) {
      break
    }
  }

  return acc
}

async function fetchAllMyMuteLists(
  store: RootStoreModel,
): Promise<GetListMutes.Response> {
  let acc: GetListMutes.Response = {
    success: true,
    headers: {},
    data: {
      subject: undefined,
      lists: [],
    },
  }

  let cursor
  for (let i = 0; i < 100; i++) {
    const res: GetListMutes.Response =
      await store.agent.app.bsky.graph.getListMutes({
        cursor,
        limit: 50,
      })
    cursor = res.data.cursor
    acc.data.lists = acc.data.lists.concat(res.data.lists)
    if (!cursor) {
      break
    }
  }

  return acc
}

import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetList as GetList,
  AppBskyGraphDefs as GraphDefs,
  AppBskyGraphList,
} from '@atproto/api'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {RootStoreModel} from '../root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'

const PAGE_SIZE = 30

export class ListModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  loadMoreError = ''
  hasMore = true
  loadMoreCursor?: string

  // data
  list: GraphDefs.ListView | null = null
  items: GraphDefs.ListItemView[] = []

  static async createModList(
    rootStore: RootStoreModel,
    {
      name,
      description,
      avatar,
    }: {name: string; description: string; avatar: RNImage | undefined},
  ) {
    const record: AppBskyGraphList.Record = {
      purpose: 'app.bsky.graph.defs#modlist',
      name,
      description,
      avatar: undefined,
      createdAt: new Date().toISOString(),
    }
    if (avatar) {
      const blobRes = await apilib.uploadBlob(
        rootStore,
        avatar.path,
        avatar.mime,
      )
      record.avatar = blobRes.data.blob
    }
    return await rootStore.agent.app.bsky.graph.list.create(
      {
        repo: rootStore.me.did,
      },
      record,
    )
  }

  constructor(public rootStore: RootStoreModel, public uri: string) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get hasContent() {
    return this.items.length > 0
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
      const res = await this.rootStore.agent.app.bsky.graph.getList({
        list: this.uri,
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
      this.rootStore.log.error('Failed to fetch user items', err)
    }
    if (loadMoreErr) {
      this.rootStore.log.error('Failed to fetch user items', loadMoreErr)
    }
  }

  // helper functions
  // =

  _replaceAll(res: GetList.Response) {
    this.items = []
    this._appendAll(res)
  }

  _appendAll(res: GetList.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    this.list = res.data.list
    this.items = this.items.concat(
      res.data.items.map(item => ({...item, _reactKey: item.subject})),
    )
  }
}

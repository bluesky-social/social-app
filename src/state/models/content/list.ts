import {makeAutoObservable, runInAction} from 'mobx'
import {
  AtUri,
  AppBskyGraphGetList as GetList,
  AppBskyGraphDefs as GraphDefs,
  AppBskyGraphList,
  AppBskyGraphListitem,
} from '@atproto/api'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {RootStoreModel} from '../root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'
import {track} from 'lib/analytics/analytics'

const PAGE_SIZE = 30

interface ListitemRecord {
  uri: string
  value: AppBskyGraphListitem.Record
}

interface ListitemListResponse {
  cursor?: string
  records: ListitemRecord[]
}

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
    }: {name: string; description: string; avatar: RNImage | null | undefined},
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
    const res = await rootStore.agent.app.bsky.graph.list.create(
      {
        repo: rootStore.me.did,
      },
      record,
    )
    await rootStore.agent.app.bsky.graph.muteActorList({list: res.uri})
    return res
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

  get isOwner() {
    return this.list?.creator.did === this.rootStore.me.did
  }

  get isSubscribed() {
    return this.list?.viewer?.muted
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
      await this._resolveUri()
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

  async updateMetadata({
    name,
    description,
    avatar,
  }: {
    name: string
    description: string
    avatar: RNImage | null | undefined
  }) {
    if (!this.list) {
      return
    }
    if (!this.isOwner) {
      throw new Error('Cannot edit this list')
    }
    await this._resolveUri()

    // get the current record
    const {rkey} = new AtUri(this.uri)
    const {value: record} = await this.rootStore.agent.app.bsky.graph.list.get({
      repo: this.rootStore.me.did,
      rkey,
    })

    // update the fields
    record.name = name
    record.description = description
    if (avatar) {
      const blobRes = await apilib.uploadBlob(
        this.rootStore,
        avatar.path,
        avatar.mime,
      )
      record.avatar = blobRes.data.blob
    } else if (avatar === null) {
      record.avatar = undefined
    }
    return await this.rootStore.agent.com.atproto.repo.putRecord({
      repo: this.rootStore.me.did,
      collection: 'app.bsky.graph.list',
      rkey,
      record,
    })
  }

  async delete() {
    if (!this.list) {
      return
    }
    await this._resolveUri()

    // fetch all the listitem records that belong to this list
    let cursor
    let records: ListitemRecord[] = []
    for (let i = 0; i < 100; i++) {
      const res: ListitemListResponse =
        await this.rootStore.agent.app.bsky.graph.listitem.list({
          repo: this.rootStore.me.did,
          cursor,
          limit: PAGE_SIZE,
        })
      records = records.concat(
        res.records.filter(record => record.value.list === this.uri),
      )
      cursor = res.cursor
      if (!cursor) {
        break
      }
    }

    // batch delete the list and listitem records
    const createDel = (uri: string) => {
      const urip = new AtUri(uri)
      return {
        $type: 'com.atproto.repo.applyWrites#delete',
        collection: urip.collection,
        rkey: urip.rkey,
      }
    }
    await this.rootStore.agent.com.atproto.repo.applyWrites({
      repo: this.rootStore.me.did,
      writes: [createDel(this.uri)].concat(
        records.map(record => createDel(record.uri)),
      ),
    })
  }

  async subscribe() {
    if (!this.list) {
      return
    }
    await this._resolveUri()
    await this.rootStore.agent.app.bsky.graph.muteActorList({
      list: this.list.uri,
    })
    track('Lists:Subscribe')
    await this.refresh()
  }

  async unsubscribe() {
    if (!this.list) {
      return
    }
    await this._resolveUri()
    await this.rootStore.agent.app.bsky.graph.unmuteActorList({
      list: this.list.uri,
    })
    track('Lists:Unsubscribe')
    await this.refresh()
  }

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

  async _resolveUri() {
    const urip = new AtUri(this.uri)
    if (!urip.host.startsWith('did:')) {
      try {
        urip.host = await apilib.resolveName(this.rootStore, urip.host)
      } catch (e: any) {
        runInAction(() => {
          this.error = e.toString()
        })
      }
    }
    runInAction(() => {
      this.uri = urip.toString()
    })
  }

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

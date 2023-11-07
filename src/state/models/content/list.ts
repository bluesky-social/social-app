import {makeAutoObservable, runInAction} from 'mobx'
import {
  AtUri,
  AppBskyActorDefs,
  AppBskyGraphGetList as GetList,
  AppBskyGraphDefs as GraphDefs,
  AppBskyGraphList,
  AppBskyGraphListitem,
  RichText,
} from '@atproto/api'
import {Image as RNImage} from 'react-native-image-crop-picker'
import chunk from 'lodash.chunk'
import {RootStoreModel} from '../root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'
import {track} from 'lib/analytics/analytics'
import {until} from 'lib/async/until'
import {logger} from '#/logger'

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
  data: GraphDefs.ListView | null = null
  items: GraphDefs.ListItemView[] = []
  descriptionRT: RichText | null = null

  static async createList(
    rootStore: RootStoreModel,
    {
      purpose,
      name,
      description,
      avatar,
    }: {
      purpose: string
      name: string
      description: string
      avatar: RNImage | null | undefined
    },
  ) {
    if (
      purpose !== 'app.bsky.graph.defs#curatelist' &&
      purpose !== 'app.bsky.graph.defs#modlist'
    ) {
      throw new Error('Invalid list purpose: must be curatelist or modlist')
    }
    const record: AppBskyGraphList.Record = {
      purpose,
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

    // wait for the appview to update
    await until(
      5, // 5 tries
      1e3, // 1s delay between tries
      (v: GetList.Response, _e: any) => {
        return typeof v?.data?.list.uri === 'string'
      },
      () =>
        rootStore.agent.app.bsky.graph.getList({
          list: res.uri,
          limit: 1,
        }),
    )
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

  get isCuratelist() {
    return this.data?.purpose === 'app.bsky.graph.defs#curatelist'
  }

  get isModlist() {
    return this.data?.purpose === 'app.bsky.graph.defs#modlist'
  }

  get isOwner() {
    return this.data?.creator.did === this.rootStore.me.did
  }

  get isBlocking() {
    return !!this.data?.viewer?.blocked
  }

  get isMuting() {
    return !!this.data?.viewer?.muted
  }

  get isPinned() {
    return this.rootStore.preferences.isPinnedFeed(this.uri)
  }

  get creatorDid() {
    return this.data?.creator.did
  }

  getMembership(did: string) {
    return this.items.find(item => item.subject.did === did)
  }

  isMember(did: string) {
    return !!this.getMembership(did)
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

  async loadAll() {
    for (let i = 0; i < 1000; i++) {
      if (!this.hasMore) {
        break
      }
      await this.loadMore()
    }
  }

  async updateMetadata({
    name,
    description,
    avatar,
  }: {
    name: string
    description: string
    avatar: RNImage | null | undefined
  }) {
    if (!this.data) {
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
    if (!this.data) {
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
    const writes = records
      .map(record => createDel(record.uri))
      .concat([createDel(this.uri)])

    // apply in chunks
    for (const writesChunk of chunk(writes, 10)) {
      await this.rootStore.agent.com.atproto.repo.applyWrites({
        repo: this.rootStore.me.did,
        writes: writesChunk,
      })
    }

    /* dont await */ this.rootStore.preferences.removeSavedFeed(this.uri)
    this.rootStore.emitListDeleted(this.uri)
  }

  async addMember(profile: AppBskyActorDefs.ProfileViewBasic) {
    if (this.isMember(profile.did)) {
      return
    }
    await this.rootStore.agent.app.bsky.graph.listitem.create(
      {
        repo: this.rootStore.me.did,
      },
      {
        subject: profile.did,
        list: this.uri,
        createdAt: new Date().toISOString(),
      },
    )
    runInAction(() => {
      this.items = this.items.concat([
        {_reactKey: profile.did, subject: profile},
      ])
    })
  }

  /**
   * Just adds to local cache; used to reflect changes affected elsewhere
   */
  cacheAddMember(profile: AppBskyActorDefs.ProfileViewBasic) {
    if (!this.isMember(profile.did)) {
      this.items = this.items.concat([
        {_reactKey: profile.did, subject: profile},
      ])
    }
  }

  /**
   * Just removes from local cache; used to reflect changes affected elsewhere
   */
  cacheRemoveMember(profile: AppBskyActorDefs.ProfileViewBasic) {
    if (this.isMember(profile.did)) {
      this.items = this.items.filter(item => item.subject.did !== profile.did)
    }
  }

  async pin() {
    try {
      await this.rootStore.preferences.addPinnedFeed(this.uri)
    } catch (error) {
      logger.error('Failed to pin feed', {error})
    } finally {
      track('CustomFeed:Pin', {
        name: this.data?.name || '',
        uri: this.uri,
      })
    }
  }

  async togglePin() {
    if (!this.isPinned) {
      track('CustomFeed:Pin', {
        name: this.data?.name || '',
        uri: this.uri,
      })
      return this.rootStore.preferences.addPinnedFeed(this.uri)
    } else {
      track('CustomFeed:Unpin', {
        name: this.data?.name || '',
        uri: this.uri,
      })
      // TODO TEMPORARY
      // lists are temporarily piggybacking on the saved/pinned feeds preferences
      // we'll eventually replace saved feeds with the bookmarks API
      // until then, we need to unsave lists instead of just unpin them
      // -prf
      // return this.rootStore.preferences.removePinnedFeed(this.uri)
      return this.rootStore.preferences.removeSavedFeed(this.uri)
    }
  }

  async mute() {
    if (!this.data) {
      return
    }
    await this._resolveUri()
    await this.rootStore.agent.muteModList(this.data.uri)
    track('Lists:Mute')
    runInAction(() => {
      if (this.data) {
        const d = this.data
        this.data = {...d, viewer: {...(d.viewer || {}), muted: true}}
      }
    })
  }

  async unmute() {
    if (!this.data) {
      return
    }
    await this._resolveUri()
    await this.rootStore.agent.unmuteModList(this.data.uri)
    track('Lists:Unmute')
    runInAction(() => {
      if (this.data) {
        const d = this.data
        this.data = {...d, viewer: {...(d.viewer || {}), muted: false}}
      }
    })
  }

  async block() {
    if (!this.data) {
      return
    }
    await this._resolveUri()
    const res = await this.rootStore.agent.blockModList(this.data.uri)
    track('Lists:Block')
    runInAction(() => {
      if (this.data) {
        const d = this.data
        this.data = {...d, viewer: {...(d.viewer || {}), blocked: res.uri}}
      }
    })
  }

  async unblock() {
    if (!this.data || !this.data.viewer?.blocked) {
      return
    }
    await this._resolveUri()
    await this.rootStore.agent.unblockModList(this.data.uri)
    track('Lists:Unblock')
    runInAction(() => {
      if (this.data) {
        const d = this.data
        this.data = {...d, viewer: {...(d.viewer || {}), blocked: undefined}}
      }
    })
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
      logger.error('Failed to fetch user items', {error: err})
    }
    if (loadMoreErr) {
      logger.error('Failed to fetch user items', {
        error: loadMoreErr,
      })
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
    this.data = res.data.list
    this.items = this.items.concat(
      res.data.items.map(item => ({...item, _reactKey: item.subject.did})),
    )
    if (this.data.description) {
      this.descriptionRT = new RichText({
        text: this.data.description,
        facets: (this.data.descriptionFacets || [])?.slice(),
      })
    } else {
      this.descriptionRT = null
    }
  }
}

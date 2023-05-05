import {makeAutoObservable} from 'mobx'
import {
  AppBskyGraphGetList as GetList,
  AppBskyActorDefs,
  AppBskyGraphDefs,
  AppBskyGraphList,
  AppBskyRichtextFacet,
  RichText,
} from '@atproto/api'
import {Image as RNImage} from 'react-native-image-crop-picker'
import {RootStoreModel} from '../root-store'
import * as apilib from 'lib/api/index'
import {cleanError} from 'lib/strings/errors'

export class ListModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetList.QueryParams

  // data
  uri: string
  creator: AppBskyActorDefs.ProfileView
  name: string
  purpose: AppBskyGraphDefs.ListPurpose
  description?: string
  descriptionFacets?: AppBskyRichtextFacet.Main[]
  avatar?: string
  viewer?: AppBskyGraphDefs.ListViewerState
  indexedAt?: string

  // added data
  descriptionRichText?: RichText = new RichText({text: ''})

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

  constructor(public rootStore: RootStoreModel, params: GetList.QueryParams) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.params = params
  }

  get hasContent() {
    return this.uri !== ''
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  async setup() {
    await this._load()
  }

  async refresh() {
    await this._load(true)
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
      this.rootStore.log.error('Failed to fetch profile', err)
    }
  }

  // loader functions
  // =

  async _load(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.agent.app.bsky.graph.getList(this.params)
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  _replaceAll(res: GetList.Response) {
    this.uri = res.data.list.uri
    this.creator = res.data.list.creator
    this.name = res.data.list.name
    this.purpose = res.data.list.purpose
    this.description = res.data.list.description
    this.descriptionFacets = res.data.list.descriptionFacets
    this.avatar = res.data.list.avatar
    this.viewer = res.data.list.viewer
    this.indexedAt = res.data.list.indexedAt
    this.descriptionRichText = new RichText({
      text: this.description || '',
      facets: this.descriptionFacets,
    })
  }
}

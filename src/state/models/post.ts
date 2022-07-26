import {makeAutoObservable} from 'mobx'
import {bsky, AdxUri} from '@adxp/mock-api'
import {RootStoreModel} from './root-store'

export type PostEntities = bsky.Post.Record['entities']
export type PostReply = bsky.Post.Record['reply']
export class PostModel implements bsky.Post.Record {
  // state
  isLoading = false
  hasLoaded = false
  error = ''
  uri: string = ''

  // data
  text: string = ''
  entities?: PostEntities
  reply?: PostReply
  createdAt: string = ''

  constructor(public rootStore: RootStoreModel, uri: string) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        uri: false,
      },
      {autoBind: true},
    )
    this.uri = uri
  }

  get hasContent() {
    return this.createdAt !== ''
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

  // state transitions
  // =

  private _xLoading() {
    this.isLoading = true
    this.error = ''
  }

  private _xIdle(err: string = '') {
    this.isLoading = false
    this.hasLoaded = true
    this.error = err
  }

  // loader functions
  // =

  private async _load() {
    this._xLoading()
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    try {
      const urip = new AdxUri(this.uri)
      const res = await this.rootStore.api.mainPds
        .repo(urip.host, false)
        .collection(urip.collection)
        .get('Post', urip.recordKey)
      if (!res.valid) {
        throw new Error(res.error)
      }
      this._replaceAll(res.value)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load post: ${e.toString()}`)
    }
  }

  private _replaceAll(res: bsky.Post.Record) {
    this.text = res.text
    this.entities = res.entities
    this.reply = res.reply
    this.createdAt = res.createdAt
  }
}

import {makeAutoObservable} from 'mobx'
import {AppBskyFeedPost as Post} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'

type RemoveIndex<T> = {
  [P in keyof T as string extends P
    ? never
    : number extends P
    ? never
    : P]: T[P]
}
export class PostModel implements RemoveIndex<Post.Record> {
  // state
  isLoading = false
  hasLoaded = false
  error = ''
  uri: string = ''

  // data
  text: string = ''
  entities?: Post.Entity[]
  reply?: Post.ReplyRef
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

  get rootUri(): string {
    if (this.reply?.root.uri) {
      return this.reply.root.uri
    }
    return this.uri
  }

  get isThreadMuted() {
    return this.rootStore.mutedThreads.uris.has(this.rootUri)
  }

  // public api
  // =

  async setup() {
    await this._load()
  }

  async toggleThreadMute() {
    if (this.isThreadMuted) {
      this.rootStore.mutedThreads.uris.delete(this.rootUri)
    } else {
      this.rootStore.mutedThreads.uris.add(this.rootUri)
    }
  }

  // state transitions
  // =

  _xLoading() {
    this.isLoading = true
    this.error = ''
  }

  _xIdle(err?: any) {
    this.isLoading = false
    this.hasLoaded = true
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch post', err)
    }
  }

  // loader functions
  // =

  async _load() {
    this._xLoading()
    try {
      const urip = new AtUri(this.uri)
      const res = await this.rootStore.agent.getPost({
        repo: urip.host,
        rkey: urip.rkey,
      })
      // TODO
      // if (!res.valid) {
      //   throw new Error(res.error)
      // }
      this._replaceAll(res.value)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  _replaceAll(res: Post.Record) {
    this.text = res.text
    this.entities = res.entities
    this.reply = res.reply
    this.createdAt = res.createdAt
  }
}

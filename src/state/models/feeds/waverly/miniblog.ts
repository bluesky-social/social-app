import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyEmbedExternal, RichText} from '@atproto/api'
import {SocialWaverlyMiniblog as Miniblog} from '@waverlyai/atproto-api'
import {RootStoreModel} from '../../root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'
import {
  extractMiniblogUriInfo,
  findMiniblogUriInText,
} from 'lib/waverly/miniblog-uris'
import {PostsFeedItemModel} from '../post'

interface Params {
  repo: string
  rkey: string
  record?: Miniblog.Record
}

export class MiniblogModel {
  // data
  isLoading = false
  error = ''
  repo: string
  rkey: string
  richText: RichText | undefined = undefined

  // data
  record: Miniblog.Record | undefined = undefined

  static fromFeedItem(rootStore: RootStoreModel, item: PostsFeedItemModel) {
    const external = item.post.embed
      ?.external as AppBskyEmbedExternal.ViewExternal
    let result = extractMiniblogUriInfo(external?.uri)
    if (!result) result = findMiniblogUriInText(item.richText?.text)
    if (!result) return
    return new MiniblogModel(rootStore, {
      repo: result.handle,
      rkey: result.rkey,
    })
  }

  constructor(public rootStore: RootStoreModel, params: Params) {
    this.repo = params.repo
    this.rkey = params.rkey
    if (params.record) {
      try {
        this._validateAndSet(params.record)
      } catch (e) {
        this._xIdle(e)
      }
    }
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }

  get hasError() {
    return this.error !== ''
  }

  get hasLoaded() {
    return !this.isLoading && this.record !== undefined
  }

  // public api
  // =

  load = bundleAsync(async () => {
    if (this.record !== undefined) return
    console.log('MiniblogModel.load', this.repo, this.rkey)
    try {
      this._xLoading()
      console.log(`this.rootStore.watAgent: `, this.rootStore.watAgent.service)
      const res = await this.rootStore.watAgent.api.social.waverly.miniblog.get(
        {
          repo: this.repo,
          rkey: this.rkey,
        },
      )
      runInAction(() => {
        this._validateAndSet(res.value)
        this._xIdle()
      })
    } catch (e: any) {
      runInAction(() => {
        this._xIdle(e)
      })
    }
  })

  // state transitions
  // =

  _xLoading() {
    this.isLoading = true
    this.error = ''
  }

  _xIdle(err?: any) {
    this.isLoading = false
    this.error = cleanError(err)
    if (err) this.rootStore.log.error('Failed to fetch miniblog', err)
  }

  // helper functions
  // =

  _validateAndSet(record: Miniblog.Record) {
    const valid = Miniblog.validateRecord(record)
    if (valid.success) {
      this.record = record
      this.richText = new RichText(this.record, {cleanNewlines: true})
    } else {
      this.record = undefined
      this.richText = undefined
      throw new Error(this.error)
    }
  }
}

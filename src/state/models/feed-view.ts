import {makeAutoObservable, runInAction} from 'mobx'
import {bsky} from '@adxp/mock-api'
import {RootStoreModel} from './root-store'

export class FeedViewItemModel implements bsky.FeedView.FeedItem {
  key: string = ''
  uri: string = ''
  author: bsky.FeedView.User = {did: '', name: '', displayName: ''}
  repostedBy?: bsky.FeedView.User
  record: Record<string, unknown> = {}
  embed?:
    | bsky.FeedView.RecordEmbed
    | bsky.FeedView.ExternalEmbed
    | bsky.FeedView.UnknownEmbed
  replyCount: number = 0
  repostCount: number = 0
  likeCount: number = 0
  indexedAt: string = ''

  constructor(key: string, v: bsky.FeedView.FeedItem) {
    makeAutoObservable(this)
    this.key = key
    Object.assign(this, v)
  }
}

export class FeedViewModel implements bsky.FeedView.Response {
  state = 'idle'
  error = ''
  params: bsky.FeedView.Params
  feed: FeedViewItemModel[] = []

  constructor(public rootStore: RootStoreModel, params: bsky.FeedView.Params) {
    makeAutoObservable(
      this,
      {rootStore: false, params: false},
      {autoBind: true},
    )
    this.params = params
  }

  get hasContent() {
    return this.feed.length !== 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isLoading() {
    return this.state === 'loading'
  }

  get isEmpty() {
    return !this.hasContent && !this.hasError && !this.isLoading
  }

  async fetch() {
    if (this.hasContent) {
      await this.updateContent()
    } else {
      await this.initialLoad()
    }
  }

  async initialLoad() {
    this.state = 'loading'
    this.error = ''
    try {
      const res = (await this.rootStore.api.mainPds.view(
        'blueskyweb.xyz:FeedView',
        this.params,
      )) as bsky.FeedView.Response
      this._replaceAll(res)
      runInAction(() => {
        this.state = 'idle'
      })
    } catch (e: any) {
      runInAction(() => {
        this.state = 'error'
        this.error = `Failed to load feed: ${e.toString()}`
      })
    }
  }

  async updateContent() {
    // TODO: refetch and update items
  }

  private _replaceAll(res: bsky.FeedView.Response) {
    this.feed.length = 0
    let counter = 0
    for (const item of res.feed) {
      // TODO: validate .record
      this.feed.push(new FeedViewItemModel(`item-${counter++}`, item))
    }
  }
}

import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from './root-store'

interface Response {
  data: {
    suggestions: ResponseSuggestedActor[]
  }
}
export type ResponseSuggestedActor = {
  did: string
  handle: string
  displayName?: string
  description?: string
  createdAt?: string
  indexedAt: string
}

export type SuggestedActor = ResponseSuggestedActor & {
  _reactKey: string
}

export class SuggestedActorsViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''

  // data
  suggestions: SuggestedActor[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get hasContent() {
    return this.suggestions.length > 0
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
    await this._fetch()
  }

  async refresh() {
    await this._fetch(true)
  }

  async loadMore() {
    // TODO
  }

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err: string = '') {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err
  }

  // loader functions
  // =

  private async _fetch(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const debugRes = await this.rootStore.api.app.bsky.graph.getFollowers({
        user: 'alice.test',
      })
      const res = {
        data: {
          suggestions: debugRes.data.followers,
        },
      }
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private _replaceAll(res: Response) {
    this.suggestions.length = 0
    let counter = 0
    for (const item of res.data.suggestions) {
      this._append({
        _reactKey: `item-${counter++}`,
        description: 'Just another cool person using Bluesky',
        ...item,
      })
    }
  }

  private _append(item: SuggestedActor) {
    this.suggestions.push(item)
  }
}

import {makeAutoObservable} from 'mobx'
import * as GetSuggestions from '../../third-party/api/src/client/types/app/bsky/actor/getSuggestions'
import {RootStoreModel} from './root-store'

type ResponseSuggestedActor = GetSuggestions.OutputSchema['actors'][number]
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
      const res = await this.rootStore.api.app.bsky.actor.getSuggestions()
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private _replaceAll(res: GetSuggestions.Response) {
    this.suggestions.length = 0
    let counter = 0
    for (const item of res.data.actors) {
      this._append({
        _reactKey: `item-${counter++}`,
        ...item,
      })
    }
  }

  private _append(item: SuggestedActor) {
    this.suggestions.push(item)
  }
}

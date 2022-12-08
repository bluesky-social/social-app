import {makeAutoObservable} from 'mobx'
import * as GetSuggestions from '../../third-party/api/src/client/types/app/bsky/actor/getSuggestions'
import {RootStoreModel} from './root-store'

export type SuggestedActor = GetSuggestions.Actor & {
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
    this.suggestions.length = 0
    this._xLoading(isRefreshing)
    let cursor
    let res
    try {
      do {
        res = await this.rootStore.api.app.bsky.actor.getSuggestions({
          limit: 20,
          cursor,
        })
        this._appendAll(res)
        cursor = res.data.cursor
      } while (
        cursor &&
        res.data.actors.length === 20 &&
        this.suggestions.length < 20
      )
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private _appendAll(res: GetSuggestions.Response) {
    for (const item of res.data.actors) {
      if (item.did === this.rootStore.me.did) {
        continue // skip self
      }
      if (item.myState?.follow) {
        continue // skip already-followed users
      }
      this._append({
        _reactKey: `item-${this.suggestions.length}`,
        ...item,
      })
    }
  }

  private _append(item: SuggestedActor) {
    this.suggestions.push(item)
  }
}

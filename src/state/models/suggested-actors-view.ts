import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyActorGetSuggestions as GetSuggestions} from '@atproto/api'
import {RootStoreModel} from './root-store'

const PAGE_SIZE = 30

export type SuggestedActor = GetSuggestions.Actor

export class SuggestedActorsViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  hasMore = true
  loadMoreCursor?: string
  private _loadMorePromise: Promise<void> | undefined

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

  async refresh() {
    return this.loadMore(true)
  }

  async loadMore(isRefreshing = false) {
    if (this._loadMorePromise) {
      return this._loadMorePromise
    }
    this._loadMorePromise = this._loadMore(isRefreshing)
    await this._loadMorePromise
    this._loadMorePromise = undefined
  }

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err ? err.toString() : ''
    if (err) {
      this.rootStore.log.error('Failed to fetch suggested actors', err)
    }
  }

  // loader functions
  // =

  private async _loadMore(isRefreshing = false) {
    if (!this.hasMore) {
      return
    }
    this._xLoading(isRefreshing)
    try {
      if (this.isRefreshing) {
        this.suggestions = []
      }
      let res
      let items: SuggestedActor[] = []
      do {
        res = await this.rootStore.api.app.bsky.actor.getSuggestions({
          limit: PAGE_SIZE,
          cursor: this.loadMoreCursor,
        })
        this.loadMoreCursor = res.data.cursor
        this.hasMore = !!this.loadMoreCursor
        items = items.concat(
          res.data.actors.filter(actor => {
            if (actor.did === this.rootStore.me.did) {
              return false // skip self
            }
            if (actor.myState?.follow) {
              return false // skip already-followed users
            }
            return true
          }),
        )
      } while (items.length < PAGE_SIZE && this.hasMore)
      runInAction(() => {
        this.suggestions = this.suggestions.concat(items)
      })
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }
}

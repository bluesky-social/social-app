import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyActorGetSuggestions as GetSuggestions} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {cleanError} from '../../lib/strings'
import {bundleAsync} from '../../lib/async/bundle'

const PAGE_SIZE = 30

export type SuggestedActor = GetSuggestions.Actor

export class SuggestedActorsViewModel {
  // state
  pageSize = PAGE_SIZE
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  hasMore = true
  loadMoreCursor?: string

  // data
  suggestions: SuggestedActor[] = []

  constructor(public rootStore: RootStoreModel, opts?: {pageSize?: number}) {
    if (opts?.pageSize) {
      this.pageSize = opts.pageSize
    }
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

  loadMore = bundleAsync(async (replace: boolean = false) => {
    if (!replace && !this.hasMore) {
      return
    }
    this._xLoading(replace)
    try {
      let items: SuggestedActor[] = this.suggestions
      if (replace) {
        items = []
        this.loadMoreCursor = undefined
      }
      let res
      do {
        res = await this.rootStore.api.app.bsky.actor.getSuggestions({
          limit: this.pageSize,
          cursor: this.loadMoreCursor,
        })
        this.loadMoreCursor = res.data.cursor
        this.hasMore = !!this.loadMoreCursor
        items = items.concat(res.data.actors)
      } while (items.length < this.pageSize && this.hasMore)
      runInAction(() => {
        this.suggestions = items
      })
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  })

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
    this.error = cleanError(err)
    if (err) {
      this.rootStore.log.error('Failed to fetch suggested actors', err)
    }
  }
}

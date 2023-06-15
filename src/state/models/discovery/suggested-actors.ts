import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyActorDefs} from '@atproto/api'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'

const PAGE_SIZE = 30

export type SuggestedActor =
  | AppBskyActorDefs.ProfileViewBasic
  | AppBskyActorDefs.ProfileView

export class SuggestedActorsModel {
  // state
  pageSize = PAGE_SIZE
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  loadMoreCursor: string | undefined = undefined
  error = ''
  hasMore = false

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
    if (replace) {
      this.hasMore = true
      this.loadMoreCursor = undefined
    }
    if (!this.hasMore) {
      return
    }
    this._xLoading(replace)
    try {
      const res = await this.rootStore.agent.app.bsky.actor.getSuggestions({
        limit: 25,
        cursor: this.loadMoreCursor,
      })
      const {actors, cursor} = res.data
      this.rootStore.me.follows.hydrateProfiles(actors)

      runInAction(() => {
        if (replace) {
          this.suggestions = []
        }
        this.loadMoreCursor = cursor
        this.hasMore = !!cursor
        this.suggestions = this.suggestions.concat(
          actors.filter(actor => {
            if (actor.viewer?.following) {
              return false
            }
            if (actor.did === this.rootStore.me.did) {
              return false
            }
            return true
          }),
        )
      })
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  })

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
      this.rootStore.log.error('Failed to fetch suggested actors', err)
    }
  }
}

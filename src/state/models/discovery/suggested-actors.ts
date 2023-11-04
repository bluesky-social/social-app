import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
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
  lastInsertedAtIndex = -1

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
      let {actors, cursor} = res.data
      actors = actors.filter(
        actor =>
          !moderateProfile(actor, this.rootStore.preferences.moderationOpts)
            .account.filter,
      )
      this.rootStore.me.follows.hydrateMany(actors)

      runInAction(() => {
        if (replace) {
          this.suggestions = []
        }
        this.loadMoreCursor = cursor
        this.hasMore = !!cursor
        this.suggestions = this.suggestions.concat(
          actors.filter(actor => {
            const viewer = actor.viewer
            if (viewer) {
              if (
                viewer.following ||
                viewer.muted ||
                viewer.mutedByList ||
                viewer.blockedBy ||
                viewer.blocking
              ) {
                return false
              }
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

  async insertSuggestionsByActor(actor: string, indexToInsertAt: number) {
    // fetch suggestions
    const res =
      await this.rootStore.agent.app.bsky.graph.getSuggestedFollowsByActor({
        actor: actor,
      })
    const {suggestions: moreSuggestions} = res.data
    this.rootStore.me.follows.hydrateMany(moreSuggestions)
    // dedupe
    const toInsert = moreSuggestions.filter(
      s => !this.suggestions.find(s2 => s2.did === s.did),
    )
    //  insert
    this.suggestions.splice(indexToInsertAt + 1, 0, ...toInsert)
    // update index
    this.lastInsertedAtIndex = indexToInsertAt
  }

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
      this.rootStore.log.error('Failed to fetch suggested actors', {error: err})
    }
  }
}

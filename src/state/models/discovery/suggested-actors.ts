import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyActorDefs} from '@atproto/api'
import shuffle from 'lodash.shuffle'
import {RootStoreModel} from '../root-store'
import {cleanError} from 'lib/strings/errors'
import {bundleAsync} from 'lib/async/bundle'
import {SUGGESTED_FOLLOWS} from 'lib/constants'

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
  error = ''
  hasMore = true
  loadMoreCursor?: string

  hardCodedSuggestions: SuggestedActor[] | undefined

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
    if (replace) {
      this.hardCodedSuggestions = undefined
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
        await this.fetchHardcodedSuggestions()
        if (this.hardCodedSuggestions && this.hardCodedSuggestions.length > 0) {
          // pull from the hard-coded suggestions
          const newItems = this.hardCodedSuggestions.splice(0, this.pageSize)
          items = items.concat(newItems)
          this.hasMore = true
          this.loadMoreCursor = undefined
        } else {
          // pull from the PDS' algo
          res = await this.rootStore.agent.app.bsky.actor.getSuggestions({
            limit: this.pageSize,
            cursor: this.loadMoreCursor,
          })
          this.loadMoreCursor = res.data.cursor
          this.hasMore = !!this.loadMoreCursor
          items = items.concat(
            res.data.actors.filter(
              actor => !items.find(i => i.did === actor.did),
            ),
          )
        }
      } while (items.length < this.pageSize && this.hasMore)
      runInAction(() => {
        this.suggestions = items
      })
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  })

  async fetchHardcodedSuggestions() {
    if (this.hardCodedSuggestions) {
      return
    }
    await this.rootStore.me.follows.fetchIfNeeded()
    try {
      // clone the array so we can mutate it
      const actors = [
        ...SUGGESTED_FOLLOWS(
          this.rootStore.session.currentSession?.service || '',
        ),
      ]

      // fetch the profiles in chunks of 25 (the limit allowed by `getProfiles`)
      let profiles: AppBskyActorDefs.ProfileView[] = []
      do {
        const res = await this.rootStore.agent.getProfiles({
          actors: actors.splice(0, 25),
        })
        profiles = profiles.concat(res.data.profiles)
      } while (actors.length)

      runInAction(() => {
        profiles = profiles.filter(profile => {
          if (this.rootStore.me.follows.isFollowing(profile.did)) {
            return false
          }
          if (profile.did === this.rootStore.me.did) {
            return false
          }
          return true
        })
        this.hardCodedSuggestions = shuffle(profiles)
      })
    } catch (e) {
      this.rootStore.log.error(
        'Failed to getProfiles() for suggested follows',
        {e},
      )
      runInAction(() => {
        this.hardCodedSuggestions = []
      })
    }
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
      this.rootStore.log.error('Failed to fetch suggested actors', err)
    }
  }
}

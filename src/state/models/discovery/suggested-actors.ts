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
    if (this.suggestions.length && !replace) {
      return
    }
    this._xLoading(replace)
    try {
      // clone the array so we can mutate it
      const actors = [
        ...SUGGESTED_FOLLOWS(
          this.rootStore.session.currentSession?.service || '',
        ),
      ]
      const res = await this.rootStore.agent.getProfiles({
        actors: shuffle(actors).splice(0, 25),
      })
      const {profiles} = res.data
      this.rootStore.me.follows.hydrateProfiles(profiles)

      runInAction(() => {
        this.suggestions = profiles.filter(profile => {
          if (profile.viewer?.following) {
            return false
          }
          if (profile.did === this.rootStore.me.did) {
            return false
          }
          return true
        })
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

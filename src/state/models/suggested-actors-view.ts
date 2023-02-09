import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyActorGetSuggestions as GetSuggestions,
  AppBskyActorProfile as Profile,
} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {cleanError} from '../../lib/strings'
import {bundleAsync} from '../../lib/async/bundle'
import {
  devSuggestedFollows,
  productionSuggestedFollows,
  stagingSuggestedFollows,
} from '../../lib/suggestedFollows'

const PAGE_SIZE = 30

export type SuggestedActor = GetSuggestions.Actor | Profile.View

const getSuggestionList = ({serviceUrl}: {serviceUrl: string}) => {
  if (serviceUrl.includes('localhost')) {
    return devSuggestedFollows
  } else if (serviceUrl.includes('staging')) {
    return stagingSuggestedFollows
  } else {
    return productionSuggestedFollows
  }
}

export class SuggestedActorsViewModel {
  // state
  pageSize = PAGE_SIZE
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  hasMore = true
  loadMoreCursor?: string
  haveUsedHardcodedSuggestions = false

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
        if (!this.haveUsedHardcodedSuggestions) {
          this.haveUsedHardcodedSuggestions = true
          const suggestionsList = getSuggestionList({
            serviceUrl: this.rootStore.session.currentSession?.service || '',
          })
          res = await this.rootStore.api.app.bsky.actor.getProfiles({
            actors: suggestionsList,
          })
          const profiles = res.data.profiles
          items = items.concat(
            profiles.filter(profile => !profile.myState?.follow),
          )
          this.hasMore = true
          this.loadMoreCursor = undefined
        } else {
          res = await this.rootStore.api.app.bsky.actor.getSuggestions({
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

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''

    if (isRefreshing) {
      this.haveUsedHardcodedSuggestions = false
    }
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

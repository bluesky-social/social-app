import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'
import {UserFollowsViewModel, FollowItem} from './user-follows-view'
import {GetAssertionsView} from './get-assertions-view'
import {APP_BSKY_SYSTEM, APP_BSKY_GRAPH} from '@atproto/api'

export interface SuggestedInvitesViewParams {
  sceneDid: string
}

export class SuggestedInvitesView {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: SuggestedInvitesViewParams
  sceneAssertionsView: GetAssertionsView
  myFollowsView: UserFollowsViewModel

  // data
  suggestions: FollowItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: SuggestedInvitesViewParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.params = params
    this.sceneAssertionsView = new GetAssertionsView(rootStore, {
      author: params.sceneDid,
      assertion: APP_BSKY_GRAPH.AssertMember,
    })
    this.myFollowsView = new UserFollowsViewModel(rootStore, {
      user: rootStore.me.did || '',
    })
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

  get unconfirmed() {
    return this.sceneAssertionsView.unconfirmed
  }

  // public api
  // =

  async setup() {
    await this._fetch(false)
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
      // TODO need to fetch all!
      await this.sceneAssertionsView.setup()
    } catch (e: any) {
      this.rootStore.log.error(
        'Failed to fetch current scene members in suggested invites',
        e.toString(),
      )
      this._xIdle(
        'Failed to fetch the current scene members. Check your internet connection and try again.',
      )
      return
    }
    try {
      await this.myFollowsView.setup()
    } catch (e: any) {
      this.rootStore.log.error(
        'Failed to fetch current followers in suggested invites',
        e.toString(),
      )
      this._xIdle(
        'Failed to fetch the your current followers. Check your internet connection and try again.',
      )
      return
    }

    // collect all followed users that arent already in the scene
    const newSuggestions: FollowItem[] = []
    for (const follow of this.myFollowsView.follows) {
      if (follow.declaration.actorType !== APP_BSKY_SYSTEM.ActorUser) {
        continue
      }
      if (!this.sceneAssertionsView.getBySubject(follow.did)) {
        newSuggestions.push(follow)
      }
    }
    runInAction(() => {
      this.suggestions = newSuggestions
    })
    this._xIdle()
  }
}

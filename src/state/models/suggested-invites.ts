import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from './root-store'
import {MembersViewModel} from './members-view'
import {UserFollowsViewModel, FollowItem} from './user-follows-view'
import {APP_BSKY_SYSTEM} from '../../third-party/api'

export interface SuggestedInvites {
  sceneDid: string
}

export class SuggestedInvites {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: SuggestedInvites
  sceneMembersView: MembersViewModel
  myFollowsView: UserFollowsViewModel

  // data
  suggestions: FollowItem[] = []

  constructor(public rootStore: RootStoreModel, params: SuggestedInvites) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.params = params
    this.sceneMembersView = new MembersViewModel(rootStore, {
      actor: params.sceneDid,
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
      await this.sceneMembersView.setup()
    } catch (e) {
      console.error(e)
      this._xIdle(
        'Failed to fetch the current scene members. Check your internet connection and try again.',
      )
      return
    }
    try {
      await this.myFollowsView.setup()
    } catch (e) {
      console.error(e)
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
      if (
        !this.sceneMembersView.members.find(member => member.did === follow.did)
      ) {
        newSuggestions.push(follow)
      }
    }
    runInAction(() => {
      this.suggestions = newSuggestions
    })
    this._xIdle()
  }
}

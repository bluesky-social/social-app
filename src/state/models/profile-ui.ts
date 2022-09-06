import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from './root-store'
import {ProfileViewModel} from './profile-view'
import {FeedViewModel} from './feed-view'
import {BadgesViewModel} from './badges-view'

export const SECTION_IDS = {
  POSTS: 0,
  BADGES: 1,
}

export interface ProfileUiParams {
  user: string
}

export class ProfileUiModel {
  // constants
  static SELECTOR_ITEMS = ['Posts', 'Badges']

  // data
  profile: ProfileViewModel
  feed: FeedViewModel
  badges: BadgesViewModel

  // ui state
  selectedViewIndex = 0

  constructor(
    public rootStore: RootStoreModel,
    public params: ProfileUiParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.profile = new ProfileViewModel(rootStore, {user: params.user})
    this.feed = new FeedViewModel(rootStore, {author: params.user, limit: 10})
    this.badges = new BadgesViewModel(rootStore)
  }

  get currentView(): FeedViewModel | BadgesViewModel {
    if (this.selectedViewIndex === SECTION_IDS.POSTS) {
      return this.feed
    }
    if (this.selectedViewIndex === SECTION_IDS.BADGES) {
      return this.badges
    }
    throw new Error(`Invalid selector value: ${this.selectedViewIndex}`)
  }

  get isInitialLoading() {
    const view = this.currentView
    return view.isLoading && !view.isRefreshing && !view.hasContent
  }

  get isRefreshing() {
    return this.profile.isRefreshing || this.currentView.isRefreshing
  }

  // public api
  // =

  setSelectedViewIndex(index: number) {
    this.selectedViewIndex = index
  }

  async setup() {
    await Promise.all([
      this.profile
        .setup()
        .catch(err => console.error('Failed to fetch profile', err)),
      this.feed
        .setup()
        .catch(err => console.error('Failed to fetch feed', err)),
      this.badges
        .setup()
        .catch(err => console.error('Failed to fetch badges', err)),
    ])
  }

  async update() {
    await this.currentView.update()
  }

  async refresh() {
    await Promise.all([this.profile.refresh(), this.currentView.refresh()])
  }

  async loadMore() {
    if (!this.currentView.isLoading && !this.currentView.hasError) {
      await this.currentView.loadMore()
    }
  }
}

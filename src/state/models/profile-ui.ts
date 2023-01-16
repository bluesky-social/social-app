import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from './root-store'
import {ProfileViewModel} from './profile-view'
import {FeedModel} from './feed-view'

export enum Sections {
  Posts = 'Posts',
  PostsWithReplies = 'Posts & replies',
}

const USER_SELECTOR_ITEMS = [Sections.Posts, Sections.PostsWithReplies]

export interface ProfileUiParams {
  user: string
}

export class ProfileUiModel {
  // data
  profile: ProfileViewModel
  feed: FeedModel

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
    this.profile = new ProfileViewModel(rootStore, {actor: params.user})
    this.feed = new FeedModel(rootStore, 'author', {
      author: params.user,
      limit: 10,
    })
  }

  get currentView(): FeedModel {
    if (
      this.selectedView === Sections.Posts ||
      this.selectedView === Sections.PostsWithReplies
    ) {
      return this.feed
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

  get isUser() {
    return this.profile.isUser
  }

  get selectorItems() {
    if (this.isUser) {
      return USER_SELECTOR_ITEMS
    } else {
      return USER_SELECTOR_ITEMS
    }
  }

  get selectedView() {
    return this.selectorItems[this.selectedViewIndex]
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
        .catch(err => this.rootStore.log.error('Failed to fetch profile', err)),
      this.feed
        .setup()
        .catch(err => this.rootStore.log.error('Failed to fetch feed', err)),
    ])
  }

  async update() {
    const view = this.currentView
    if (view instanceof FeedModel) {
      await view.update()
    } else {
      await view.refresh()
    }
  }

  async refresh() {
    await Promise.all([this.profile.refresh(), this.currentView.refresh()])
  }

  async loadMore() {
    if (
      !this.currentView.isLoading &&
      !this.currentView.hasError &&
      !this.currentView.isEmpty
    ) {
      await this.currentView.loadMore()
    }
  }
}

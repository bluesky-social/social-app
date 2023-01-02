import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from './root-store'
import {ProfileViewModel} from './profile-view'
import {MembersViewModel} from './members-view'
import {MembershipsViewModel} from './memberships-view'
import {FeedModel} from './feed-view'

export enum Sections {
  Posts = 'Posts',
  PostsWithReplies = 'Posts & replies',
  Scenes = 'Scenes',
  Trending = 'Trending',
  Members = 'Members',
}

const USER_SELECTOR_ITEMS = [
  Sections.Posts,
  Sections.PostsWithReplies,
  Sections.Scenes,
]
const SCENE_SELECTOR_ITEMS = [Sections.Trending, Sections.Members]

export interface ProfileUiParams {
  user: string
}

export class ProfileUiModel {
  // data
  profile: ProfileViewModel
  feed: FeedModel
  memberships: MembershipsViewModel
  members: MembersViewModel

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
    this.memberships = new MembershipsViewModel(rootStore, {actor: params.user})
    this.members = new MembersViewModel(rootStore, {actor: params.user})
  }

  get currentView(): FeedModel | MembershipsViewModel | MembersViewModel {
    if (
      this.selectedView === Sections.Posts ||
      this.selectedView === Sections.PostsWithReplies ||
      this.selectedView === Sections.Trending
    ) {
      return this.feed
    }
    if (this.selectedView === Sections.Scenes) {
      return this.memberships
    }
    if (this.selectedView === Sections.Members) {
      return this.members
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

  get isScene() {
    return this.profile.isScene
  }

  get selectorItems() {
    if (this.isUser) {
      return USER_SELECTOR_ITEMS
    } else if (this.isScene) {
      return SCENE_SELECTOR_ITEMS
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
        .catch(err =>
          this.rootStore.log.error('Failed to fetch profile', err.toString()),
        ),
      this.feed
        .setup()
        .catch(err =>
          this.rootStore.log.error('Failed to fetch feed', err.toString()),
        ),
    ])
    if (this.isUser) {
      await this.memberships
        .setup()
        .catch(err =>
          this.rootStore.log.error('Failed to fetch members', err.toString()),
        )
    }
    if (this.isScene) {
      await this.members
        .setup()
        .catch(err =>
          this.rootStore.log.error('Failed to fetch members', err.toString()),
        )
    }
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

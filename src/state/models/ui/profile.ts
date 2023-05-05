import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {ProfileModel} from '../content/profile'
import {PostsFeedModel} from '../feeds/posts'
import {ListsListModel} from '../lists/lists-list'

export enum Sections {
  Posts = 'Posts',
  PostsWithReplies = 'Posts & replies',
  Lists = 'Lists',
}

const USER_SELECTOR_ITEMS = [
  Sections.Posts,
  Sections.PostsWithReplies,
  Sections.Lists,
]

export interface ProfileUiParams {
  user: string
}

export class ProfileUiModel {
  static LOADING_ITEM = {_reactKey: '__loading__'}
  static END_ITEM = {_reactKey: '__end__'}
  static EMPTY_ITEM = {_reactKey: '__empty__'}

  // data
  profile: ProfileModel
  feed: PostsFeedModel
  lists: ListsListModel

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
    this.profile = new ProfileModel(rootStore, {actor: params.user})
    this.feed = new PostsFeedModel(rootStore, 'author', {
      actor: params.user,
      limit: 10,
    })
    this.lists = new ListsListModel(rootStore, params.user)
  }

  get currentView(): PostsFeedModel | ListsListModel {
    if (
      this.selectedView === Sections.Posts ||
      this.selectedView === Sections.PostsWithReplies
    ) {
      return this.feed
    } else if (this.selectedView === Sections.Lists) {
      return this.lists
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

  get selectorItems() {
    return USER_SELECTOR_ITEMS
  }

  get selectedView() {
    return this.selectorItems[this.selectedViewIndex]
  }

  get uiItems() {
    let arr: any[] = []
    if (this.isInitialLoading) {
      arr = arr.concat([ProfileUiModel.LOADING_ITEM])
    } else if (this.currentView.hasError) {
      arr = arr.concat([
        {
          _reactKey: '__error__',
          error: this.currentView.error,
        },
      ])
    } else {
      if (
        this.selectedView === Sections.Posts ||
        this.selectedView === Sections.PostsWithReplies
      ) {
        if (this.feed.hasContent) {
          if (this.selectedView === Sections.Posts) {
            arr = this.feed.nonReplyFeed
          } else {
            arr = this.feed.slices.slice()
          }
          if (!this.feed.hasMore) {
            arr = arr.concat([ProfileUiModel.END_ITEM])
          }
        } else if (this.feed.isEmpty) {
          arr = arr.concat([ProfileUiModel.EMPTY_ITEM])
        }
      } else if (this.selectedView === Sections.Lists) {
        if (this.lists.hasContent) {
          arr = this.lists.lists
        } else if (this.lists.isEmpty) {
          arr = arr.concat([ProfileUiModel.EMPTY_ITEM])
        }
      } else {
        arr = arr.concat([ProfileUiModel.EMPTY_ITEM])
      }
    }
    return arr
  }

  get showLoadingMoreFooter() {
    if (
      this.selectedView === Sections.Posts ||
      this.selectedView === Sections.PostsWithReplies
    ) {
      return this.feed.hasContent && this.feed.hasMore && this.feed.isLoading
    } else if (this.selectedView === Sections.Lists) {
      return this.lists.hasContent && this.lists.hasMore && this.lists.isLoading
    }
    return false
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
    // HACK: need to use the DID as a param, not the username -prf
    this.lists.source = this.profile.did
    this.lists
      .loadMore()
      .catch(err => this.rootStore.log.error('Failed to fetch lists', err))
  }

  async update() {
    const view = this.currentView
    if (view instanceof PostsFeedModel) {
      await view.update()
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

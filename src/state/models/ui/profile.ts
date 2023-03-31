import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {ProfileViewModel} from '../profile-view'
import {FeedModel} from '../feed-view'

export enum Sections {
  Posts = 'Posts',
  PostsWithReplies = 'Posts & replies',
}

const USER_SELECTOR_ITEMS = [Sections.Posts, Sections.PostsWithReplies]

export interface ProfileUiParams {
  user: string
}

export class ProfileUiModel {
  static LOADING_ITEM = {_reactKey: '__loading__'}
  static END_ITEM = {_reactKey: '__end__'}
  static EMPTY_ITEM = {_reactKey: '__empty__'}

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
      actor: params.user,
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
  }

  async update() {
    const view = this.currentView
    if (view instanceof FeedModel) {
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

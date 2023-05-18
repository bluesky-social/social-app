import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {ProfileModel} from '../content/profile'
import {PostsFeedModel} from '../feeds/posts'
import {ActorFeedsModel} from '../lists/actor-feeds'
import {ListsListModel} from '../lists/lists-list'

export enum Sections {
  Posts = 'Posts',
  PostsWithReplies = 'Posts & replies',
  CustomAlgorithms = 'Algos',
  Lists = 'Lists',
}

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
  algos: ActorFeedsModel
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
    this.algos = new ActorFeedsModel(rootStore, {actor: params.user})
    this.lists = new ListsListModel(rootStore, params.user)
  }

  get currentView(): PostsFeedModel | ActorFeedsModel | ListsListModel {
    if (
      this.selectedView === Sections.Posts ||
      this.selectedView === Sections.PostsWithReplies
    ) {
      return this.feed
    } else if (this.selectedView === Sections.Lists) {
      return this.lists
    }
    if (this.selectedView === Sections.CustomAlgorithms) {
      return this.algos
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
    const items = [Sections.Posts, Sections.PostsWithReplies]
    if (this.algos.hasLoaded && !this.algos.isEmpty) {
      items.push(Sections.CustomAlgorithms)
    }
    if (this.lists.hasLoaded && !this.lists.isEmpty) {
      items.push(Sections.Lists)
    }
    return items
  }

  get selectedView() {
    return this.selectorItems[this.selectedViewIndex]
  }

  get uiItems() {
    let arr: any[] = []
    // if loading, return loading item to show loading spinner
    if (this.isInitialLoading) {
      arr = arr.concat([ProfileUiModel.LOADING_ITEM])
    } else if (this.currentView.hasError) {
      // if error, return error item to show error message
      arr = arr.concat([
        {
          _reactKey: '__error__',
          error: this.currentView.error,
        },
      ])
    } else {
      // not loading, no error, show content
      if (
        this.selectedView === Sections.Posts ||
        this.selectedView === Sections.PostsWithReplies ||
        this.selectedView === Sections.CustomAlgorithms
      ) {
        if (this.feed.hasContent) {
          if (this.selectedView === Sections.CustomAlgorithms) {
            arr = this.algos.feeds
          } else if (this.selectedView === Sections.Posts) {
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
        // fallback, add empty item, to show empty message
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
    this.algos.refresh()
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

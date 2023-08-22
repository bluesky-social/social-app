import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {ProfileModel} from '../content/profile'
import {PostsFeedModel} from '../feeds/posts'
import {ActorFeedsModel} from '../lists/actor-feeds'
import {ListsListModel} from '../lists/lists-list'

export enum Sections {
  PostsNoReplies = 'Posts',
  PostsWithReplies = 'Posts & replies',
  PostsWithMedia = 'Media',
  Likes = 'Likes',
  CustomAlgorithms = 'Feeds',
  Lists = 'Lists',
}

export interface ProfileUiParams {
  user: string
}

export class ProfileUiModel {
  static LOADING_ITEM = {_reactKey: '__loading__'}
  static END_ITEM = {_reactKey: '__end__'}
  static EMPTY_ITEM = {_reactKey: '__empty__'}

  isAuthenticatedUser = false

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
      filter: 'posts_no_replies',
    })
    this.algos = new ActorFeedsModel(rootStore, {actor: params.user})
    this.lists = new ListsListModel(rootStore, params.user)
  }

  get currentView(): PostsFeedModel | ActorFeedsModel | ListsListModel {
    if (
      this.selectedView === Sections.PostsNoReplies ||
      this.selectedView === Sections.PostsWithReplies ||
      this.selectedView === Sections.PostsWithMedia ||
      this.selectedView === Sections.Likes
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
    const items = [
      Sections.PostsNoReplies,
      Sections.PostsWithReplies,
      Sections.PostsWithMedia,
      this.isAuthenticatedUser && Sections.Likes,
    ].filter(Boolean) as string[]
    if (this.algos.hasLoaded && !this.algos.isEmpty) {
      items.push(Sections.CustomAlgorithms)
    }
    if (this.lists.hasLoaded && !this.lists.isEmpty) {
      items.push(Sections.Lists)
    }
    return items
  }

  get selectedView() {
    // If, for whatever reason, the selected view index is not available, default back to posts
    // This can happen when the user was focused on a view but performed an action that caused
    // the view to disappear (e.g. deleting the last list in their list of lists https://imgflip.com/i/7txu1y)
    return this.selectorItems[this.selectedViewIndex] || Sections.PostsNoReplies
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
      if (
        this.selectedView === Sections.PostsNoReplies ||
        this.selectedView === Sections.PostsWithReplies ||
        this.selectedView === Sections.PostsWithMedia ||
        this.selectedView === Sections.Likes
      ) {
        if (this.feed.hasContent) {
          arr = this.feed.slices.slice()
          if (!this.feed.hasMore) {
            arr = arr.concat([ProfileUiModel.END_ITEM])
          }
        } else if (this.feed.isEmpty) {
          arr = arr.concat([ProfileUiModel.EMPTY_ITEM])
        }
      } else if (this.selectedView === Sections.CustomAlgorithms) {
        if (this.algos.hasContent) {
          arr = this.algos.feeds
        } else if (this.algos.isEmpty) {
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
      this.selectedView === Sections.PostsNoReplies ||
      this.selectedView === Sections.PostsWithReplies ||
      this.selectedView === Sections.PostsWithMedia ||
      this.selectedView === Sections.Likes
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
    // ViewSelector fires onSelectView on mount
    if (index === this.selectedViewIndex) return

    this.selectedViewIndex = index

    if (
      this.selectedView === Sections.PostsNoReplies ||
      this.selectedView === Sections.PostsWithReplies ||
      this.selectedView === Sections.PostsWithMedia
    ) {
      let filter = 'posts_no_replies'
      if (this.selectedView === Sections.PostsWithReplies) {
        filter = 'posts_with_replies'
      } else if (this.selectedView === Sections.PostsWithMedia) {
        filter = 'posts_with_media'
      }

      this.feed = new PostsFeedModel(
        this.rootStore,
        'author',
        {
          actor: this.params.user,
          limit: 10,
          filter,
        },
        {
          isSimpleFeed: ['posts_with_media'].includes(filter),
        },
      )

      this.feed.setup()
    } else if (this.selectedView === Sections.Likes) {
      this.feed = new PostsFeedModel(
        this.rootStore,
        'likes',
        {
          actor: this.params.user,
          limit: 10,
        },
        {
          isSimpleFeed: true,
        },
      )

      this.feed.setup()
    }
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
    this.isAuthenticatedUser =
      this.profile.did === this.rootStore.session.currentSession?.did
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

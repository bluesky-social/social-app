import {makeAutoObservable, runInAction} from 'mobx'
import {searchProfiles, searchPosts} from 'lib/api/search'
import {PostThreadModel} from '../content/post-thread'
import {AppBskyActorDefs, AppBskyFeedDefs} from '@atproto/api'
import {RootStoreModel} from '../root-store'

export class SearchUIModel {
  isPostsLoading = false
  isProfilesLoading = false
  query: string = ''
  posts: PostThreadModel[] = []
  profiles: AppBskyActorDefs.ProfileView[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this)
  }

  async fetch(q: string) {
    this.posts = []
    this.profiles = []
    this.query = q
    if (!q.trim()) {
      return
    }

    this.isPostsLoading = true
    this.isProfilesLoading = true

    const [postsSearch, profilesSearch] = await Promise.all([
      searchPosts(q).catch(_e => []),
      searchProfiles(q).catch(_e => []),
    ])

    let posts: AppBskyFeedDefs.PostView[] = []
    if (postsSearch?.length) {
      do {
        const res = await this.rootStore.agent.app.bsky.feed.getPosts({
          uris: postsSearch
            .splice(0, 25)
            .map(p => `at://${p.user.did}/${p.tid}`),
        })
        posts = posts.concat(res.data.posts)
      } while (postsSearch.length)
    }
    runInAction(() => {
      this.posts = posts.map(post =>
        PostThreadModel.fromPostView(this.rootStore, post),
      )
      this.isPostsLoading = false
    })

    let profiles: AppBskyActorDefs.ProfileView[] = []
    if (profilesSearch?.length) {
      do {
        const res = await this.rootStore.agent.getProfiles({
          actors: profilesSearch.splice(0, 25).map(p => p.did),
        })
        profiles = profiles.concat(res.data.profiles)
      } while (profilesSearch.length)
    }

    this.rootStore.me.follows.hydrateMany(profiles)

    runInAction(() => {
      this.profiles = profiles
      this.isProfilesLoading = false
    })
  }
}

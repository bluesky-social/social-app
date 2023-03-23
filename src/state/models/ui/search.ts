import {makeAutoObservable, runInAction} from 'mobx'
import {searchProfiles, searchPosts} from 'lib/api/search'
import {AppBskyActorDefs} from '@atproto/api'
import {RootStoreModel} from '../root-store'

export class SearchUIModel {
  isPostsLoading = false
  isProfilesLoading = false
  query: string = ''
  postUris: string[] = []
  profiles: AppBskyActorDefs.ProfileView[] = []

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this)
  }

  async fetch(q: string) {
    this.postUris = []
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
    runInAction(() => {
      this.postUris = postsSearch?.map(p => `at://${p.user.did}/${p.tid}`) || []
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
    runInAction(() => {
      this.profiles = profiles
      this.isProfilesLoading = false
    })
  }
}

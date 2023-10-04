import {makeAutoObservable} from 'mobx'
import {AppBskyActorDefs} from '@atproto/api'
import {RootStoreModel} from '../root-store'

type Profile = AppBskyActorDefs.ProfileViewBasic | AppBskyActorDefs.ProfileView

export enum FollowState {
  Following,
  NotFollowing,
  Unknown,
}

export interface FollowInfo {
  followRecordUri: string | undefined
  handle: string
  displayName?: string
  avatar?: string
}

/**
 * This model is used to maintain a synced local cache of the user's
 * follows. It should be periodically refreshed and updated any time
 * the user makes a change to their follows.
 */
export class MyFollowsCache {
  // data
  followDidToRecordMap: Record<string, FollowInfo> = {}

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  // public api
  // =

  clear() {
    this.followDidToRecordMap = {}
  }

  getFollowState(did: string): FollowState {
    if (typeof this.followDidToRecordMap[did] === 'undefined') {
      return FollowState.Unknown
    }
    if (typeof this.followDidToRecordMap[did].followRecordUri === 'string') {
      return FollowState.Following
    }
    return FollowState.NotFollowing
  }

  async fetchFollowState(did: string): Promise<FollowState> {
    // TODO: can we get a more efficient method for this? getProfile fetches more data than we need -prf
    const res = await this.rootStore.agent.getProfile({actor: did})
    this.hydrate(did, res.data)
    return this.getFollowState(did)
  }

  getFollowUri(did: string): string {
    const v = this.followDidToRecordMap[did]
    if (typeof v === 'string') {
      return v
    }
    throw new Error('Not a followed user')
  }

  addFollow(did: string, info: FollowInfo) {
    this.followDidToRecordMap[did] = info
  }

  removeFollow(did: string) {
    if (this.followDidToRecordMap[did]) {
      this.followDidToRecordMap[did].followRecordUri = undefined
    }
  }

  hydrate(did: string, profile: Profile) {
    this.followDidToRecordMap[did] = {
      followRecordUri: profile.viewer?.following,
      handle: profile.handle,
      displayName: profile.displayName,
      avatar: profile.avatar,
    }
  }

  hydrateMany(profiles: Profile[]) {
    for (const profile of profiles) {
      this.hydrate(profile.did, profile)
    }
  }
}

import {makeAutoObservable} from 'mobx'
import {AppBskyActorDefs} from '@atproto/api'
import {RootStoreModel} from '../root-store'

type Profile = AppBskyActorDefs.ProfileViewBasic | AppBskyActorDefs.ProfileView

export enum FollowState {
  Following,
  NotFollowing,
  Unknown,
}

/**
 * This model is used to maintain a synced local cache of the user's
 * follows. It should be periodically refreshed and updated any time
 * the user makes a change to their follows.
 */
export class MyFollowsCache {
  // data
  followDidToRecordMap: Record<string, string | boolean> = {}
  lastSync = 0
  myDid?: string

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
    this.lastSync = 0
    this.myDid = undefined
  }

  getFollowState(did: string): FollowState {
    if (typeof this.followDidToRecordMap[did] === 'undefined') {
      return FollowState.Unknown
    }
    if (typeof this.followDidToRecordMap[did] === 'string') {
      return FollowState.Following
    }
    return FollowState.NotFollowing
  }

  async fetchFollowState(did: string): Promise<FollowState> {
    // TODO: can we get a more efficient method for this? getProfile fetches more data than we need -prf
    const res = await this.rootStore.agent.getProfile({actor: did})
    if (res.data.viewer?.following) {
      this.addFollow(did, res.data.viewer.following)
    } else {
      this.removeFollow(did)
    }
    return this.getFollowState(did)
  }

  getFollowUri(did: string): string {
    const v = this.followDidToRecordMap[did]
    if (typeof v === 'string') {
      return v
    }
    throw new Error('Not a followed user')
  }

  addFollow(did: string, recordUri: string) {
    this.followDidToRecordMap[did] = recordUri
  }

  removeFollow(did: string) {
    this.followDidToRecordMap[did] = false
  }

  /**
   * Use this to incrementally update the cache as views provide information
   */
  hydrate(did: string, recordUri: string | undefined) {
    if (recordUri) {
      this.followDidToRecordMap[did] = recordUri
    } else {
      this.followDidToRecordMap[did] = false
    }
  }

  /**
   * Use this to incrementally update the cache as views provide information
   */
  hydrateProfiles(profiles: Profile[]) {
    for (const profile of profiles) {
      if (profile.viewer) {
        this.hydrate(profile.did, profile.viewer.following)
      }
    }
  }
}

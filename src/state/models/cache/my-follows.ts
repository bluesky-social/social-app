import {makeAutoObservable} from 'mobx'
import {
  AppBskyActorDefs,
  AppBskyGraphGetFollows as GetFollows,
  moderateProfile,
} from '@atproto/api'
import {RootStoreModel} from '../root-store'

const MAX_SYNC_PAGES = 10
const SYNC_TTL = 60e3 * 10 // 10 minutes

type Profile = AppBskyActorDefs.ProfileViewBasic | AppBskyActorDefs.ProfileView

export enum FollowState {
  Following,
  NotFollowing,
  Unknown,
}

export interface FollowInfo {
  did: string
  followRecordUri: string | undefined
  handle: string
  displayName: string | undefined
  avatar: string | undefined
}

/**
 * This model is used to maintain a synced local cache of the user's
 * follows. It should be periodically refreshed and updated any time
 * the user makes a change to their follows.
 */
export class MyFollowsCache {
  // data
  byDid: Record<string, FollowInfo> = {}
  lastSync = 0

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
    this.byDid = {}
  }

  /**
   * Syncs a subset of the user's follows
   * for performance reasons, caps out at 1000 follows
   */
  async syncIfNeeded() {
    if (this.lastSync > Date.now() - SYNC_TTL) {
      return
    }

    let cursor
    for (let i = 0; i < MAX_SYNC_PAGES; i++) {
      const res: GetFollows.Response = await this.rootStore.agent.getFollows({
        actor: this.rootStore.me.did,
        cursor,
        limit: 100,
      })
      res.data.follows = res.data.follows.filter(
        profile =>
          !moderateProfile(profile, this.rootStore.preferences.moderationOpts)
            .account.filter,
      )
      this.hydrateMany(res.data.follows)
      if (!res.data.cursor) {
        break
      }
      cursor = res.data.cursor
    }

    this.lastSync = Date.now()
  }

  getFollowState(did: string): FollowState {
    if (typeof this.byDid[did] === 'undefined') {
      return FollowState.Unknown
    }
    if (typeof this.byDid[did].followRecordUri === 'string') {
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
    const v = this.byDid[did]
    if (typeof v === 'string') {
      return v
    }
    throw new Error('Not a followed user')
  }

  addFollow(did: string, info: FollowInfo) {
    this.byDid[did] = info
  }

  removeFollow(did: string) {
    if (this.byDid[did]) {
      this.byDid[did].followRecordUri = undefined
    }
  }

  hydrate(did: string, profile: Profile) {
    this.byDid[did] = {
      did,
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

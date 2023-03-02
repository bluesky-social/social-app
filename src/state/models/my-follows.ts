import {makeAutoObservable, runInAction} from 'mobx'
import {FollowRecord, AppBskyActorProfile, AppBskyActorRef} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {bundleAsync} from 'lib/async/bundle'

const CACHE_TTL = 1000 * 60 * 60 // hourly
type FollowsListResponse = Awaited<ReturnType<FollowRecord['list']>>
type FollowsListResponseRecord = FollowsListResponse['records'][0]
type Profile =
  | AppBskyActorProfile.ViewBasic
  | AppBskyActorProfile.View
  | AppBskyActorRef.WithInfo

/**
 * This model is used to maintain a synced local cache of the user's
 * follows. It should be periodically refreshed and updated any time
 * the user makes a change to their follows.
 */
export class MyFollowsModel {
  // data
  followDidToRecordMap: Record<string, string> = {}
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

  fetchIfNeeded = bundleAsync(async () => {
    if (
      this.myDid !== this.rootStore.me.did ||
      Object.keys(this.followDidToRecordMap).length === 0 ||
      Date.now() - this.lastSync > CACHE_TTL
    ) {
      return await this.fetch()
    }
  })

  fetch = bundleAsync(async () => {
    this.rootStore.log.debug('MyFollowsModel:fetch running full fetch')
    let before
    let records: FollowsListResponseRecord[] = []
    do {
      const res: FollowsListResponse =
        await this.rootStore.api.app.bsky.graph.follow.list({
          user: this.rootStore.me.did,
          before,
        })
      records = records.concat(res.records)
      before = res.cursor
    } while (typeof before !== 'undefined')
    runInAction(() => {
      this.followDidToRecordMap = {}
      for (const record of records) {
        this.followDidToRecordMap[record.value.subject.did] = record.uri
      }
      this.lastSync = Date.now()
      this.myDid = this.rootStore.me.did
    })
  })

  isFollowing(did: string) {
    return !!this.followDidToRecordMap[did]
  }

  get isEmpty() {
    return Object.keys(this.followDidToRecordMap).length === 0
  }

  getFollowUri(did: string): string {
    const v = this.followDidToRecordMap[did]
    if (!v) {
      throw new Error('Not a followed user')
    }
    return v
  }

  addFollow(did: string, recordUri: string) {
    this.followDidToRecordMap[did] = recordUri
  }

  removeFollow(did: string) {
    delete this.followDidToRecordMap[did]
  }

  /**
   * Use this to incrementally update the cache as views provide information
   */
  hydrate(did: string, recordUri: string | undefined) {
    if (recordUri) {
      this.followDidToRecordMap[did] = recordUri
    } else {
      delete this.followDidToRecordMap[did]
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

import {makeAutoObservable, runInAction, computed} from 'mobx'
import {FollowRecord} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {bundleAsync} from '../../lib/async/bundle'

const CACHE_TTL = 1000 * 60 * 60 // hourly
type FollowsListResponse = Awaited<ReturnType<FollowRecord['list']>>
type FollowsListResponseRecord = FollowsListResponse['records'][0]

/**
 * This model is used to maintain a synced local cache of the user's
 * follows. It should be periodically refreshed and updated any time
 * the user makes a change to their follows.
 */
export class MyFollowsModel {
  // data
  hasValidData = false
  followDidToRecordMap: Record<string, string> = {}
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

  fetchIfNeeded = bundleAsync(async () => {
    if (
      Object.keys(this.followDidToRecordMap).length === 0 ||
      Date.now() - this.lastSync > CACHE_TTL
    ) {
      return await this.fetch()
    }
  })

  fetch = bundleAsync(async () => {
    this.rootStore.log.debug('MyFollowsModel:fetch running full fetch')
    let after = undefined
    let records: FollowsListResponseRecord[] = []
    try {
      do {
        const res: FollowsListResponse =
          await this.rootStore.api.app.bsky.graph.follow.list({
            user: this.rootStore.me.did,
            after,
          })
        records = records.concat(res.records)
        after = res.cursor
      } while (!!after)
      runInAction(() => {
        this.followDidToRecordMap = {}
        for (const record of records) {
          this.followDidToRecordMap[record.value.subject.did] = record.uri
        }
        this.lastSync = Date.now()
        this.hasValidData = true
      })
    } catch (e) {
      runInAction(() => {
        this.hasValidData = false
      })
      throw e
    }
  })

  /**
   * Checks the local cache if it's got good data
   * If it doesn't, uses the fallback given (which should
   * be provided by the view)
   */
  isFollowing(did: string, fallback?: boolean) {
    if (!this.hasValidData) {
      return fallback || false
    }
    return !!this.followDidToRecordMap[did]
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
}

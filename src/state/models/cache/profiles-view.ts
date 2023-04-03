import {makeAutoObservable} from 'mobx'
import {LRUMap} from 'lru_map'
import {RootStoreModel} from '../root-store'
import {AppBskyActorGetProfile as GetProfile} from '@atproto/api'

type CacheValue = Promise<GetProfile.Response> | GetProfile.Response
export class ProfilesCache {
  cache: LRUMap<string, CacheValue> = new LRUMap(100)

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        cache: false,
      },
      {autoBind: true},
    )
  }

  // public api
  // =

  async getProfile(did: string) {
    const cached = this.cache.get(did)
    if (cached) {
      try {
        return await cached
      } catch (e) {
        // ignore, we'll try again
      }
    }
    try {
      const promise = this.rootStore.agent.getProfile({
        actor: did,
      })
      this.cache.set(did, promise)
      const res = await promise
      this.cache.set(did, res)
      return res
    } catch (e) {
      this.cache.delete(did)
      throw e
    }
  }

  overwrite(did: string, res: GetProfile.Response) {
    if (this.cache.has(did)) {
      this.cache.set(did, res)
    }
  }
}

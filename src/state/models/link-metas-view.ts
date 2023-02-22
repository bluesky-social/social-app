import {makeAutoObservable} from 'mobx'
import {LRUMap} from 'lru_map'
import {RootStoreModel} from './root-store'
import {LinkMeta, getLinkMeta} from 'lib/link-meta/link-meta'

type CacheValue = Promise<LinkMeta> | LinkMeta
export class LinkMetasViewModel {
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

  async getLinkMeta(url: string) {
    const cached = this.cache.get(url)
    if (cached) {
      try {
        return await cached
      } catch (e) {
        // ignore, we'll try again
      }
    }
    try {
      const promise = getLinkMeta(this.rootStore, url)
      this.cache.set(url, promise)
      const res = await promise
      this.cache.set(url, res)
      return res
    } catch (e) {
      this.cache.delete(url)
      throw e
    }
  }
}

import {LRUMap} from 'lru_map'

export class HandleResolutionsCache {
  cache: LRUMap<string, string> = new LRUMap(500)
}

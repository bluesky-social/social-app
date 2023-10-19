import {makeAutoObservable, runInAction} from 'mobx'
import AwaitLock from 'await-lock'
import {RootStoreModel} from '../root-store'
import Fuse from 'fuse.js'
import {isObj, hasProp, isStrArray} from 'lib/type-guards'

/**
 * Used only to persist recent tags across app restarts.
 *
 * TODO may want an LRU?
 */
export class RecentTagsModel {
  _tags: string[] = []

  constructor() {
    makeAutoObservable(this, {}, {autoBind: true})
  }

  get tags() {
    return this._tags
  }

  add(tag: string) {
    this._tags = Array.from(new Set([tag, ...this._tags]))
  }

  remove(tag: string) {
    this._tags = this._tags.filter(t => t !== tag)
  }

  serialize() {
    return {_tags: this._tags}
  }

  hydrate(v: unknown) {
    if (isObj(v) && hasProp(v, '_tags') && isStrArray(v._tags)) {
      this._tags = Array.from(new Set(v._tags))
    }
  }
}

export class TagsAutocompleteModel {
  lock = new AwaitLock()
  isActive = false
  query = ''
  searchedTags: string[] = []
  profileTags: string[] = ['biology']

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  setActive(isActive: boolean) {
    this.isActive = isActive
  }

  commitRecentTag(tag: string) {
    this.rootStore.recentTags.add(tag)
  }

  clear() {
    this.query = ''
    this.searchedTags = []
  }

  get suggestions() {
    if (!this.isActive) {
      return []
    }

    const items = Array.from(
      // de-duplicates via Set
      new Set([
        // sample up to 3 recent tags
        ...this.rootStore.recentTags.tags.slice(0, 3),
        // sample up to 3 of your profile tags
        ...this.profileTags.slice(0, 3),
        // and all searched tags
        ...this.searchedTags,
      ]),
    )

    // no query, return default suggestions
    if (!this.query) {
      return items.slice(0, 9)
    }

    // Fuse allows weighting values too, if we ever need it
    const fuse = new Fuse(items)
    // search amongst mixed set of tags
    const results = fuse.search(this.query).map(r => r.item)
    return results.slice(0, 9)
  }

  async search(query: string) {
    this.query = query.trim()

    await this.lock.acquireAsync()

    try {
      await this._search()
    } finally {
      this.lock.release()
    }
  }

  // TODO hook up to search type-ahead
  async _search() {
    runInAction(() => {
      this.searchedTags = [
        'bluesky',
        'code',
        'coding',
        'dev',
        'developer',
        'development',
        'devlife',
      ]
    })
  }
}

import {makeAutoObservable, runInAction} from 'mobx'
import AwaitLock from 'await-lock'
import {RootStoreModel} from '../root-store'
import Fuse from 'fuse.js'
import {isObj, hasProp, isStrArray} from 'lib/type-guards'

/**
 * Used only to persist recent tags across app restarts.
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
    this._tags = Array.from(new Set([tag, ...this._tags])).slice(0, 100) // save up to 100 recent tags
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
  profileTags: string[] = []

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

    // no query, return default suggestions
    if (!this.query) {
      return Array.from(
        // de-duplicates via Set
        new Set([
          // sample 6 recent tags
          ...this.rootStore.recentTags.tags.slice(0, 6),
          // sample 3 of your profile tags
          ...this.profileTags.slice(0, 3),
        ]),
      )
    }

    // we're going to search this list
    const items = Array.from(
      // de-duplicates via Set
      new Set([
        // all recent tags
        ...this.rootStore.recentTags.tags,
        // all profile tags
        ...this.profileTags,
        // and all searched tags
        ...this.searchedTags,
      ]),
    )

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
      this.searchedTags = []
    })
  }
}

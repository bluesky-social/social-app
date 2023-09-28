import {makeAutoObservable, runInAction} from 'mobx'
import AwaitLock from 'await-lock'
import {RootStoreModel} from '../root-store'
import Fuse from 'fuse.js'
import {isObj, hasProp, isStrArray} from 'lib/type-guards'

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

  get suggestions() {
    if (!this.isActive) {
      return []
    }

    const items = Array.from(
      new Set([
        ...this.rootStore.recentTags.tags.slice(0, 3),
        ...this.profileTags.slice(0, 3),
        ...this.searchedTags,
      ]),
    )

    if (!this.query) {
      return items.slice(0, 9)
    }

    const fuse = new Fuse(items)
    const results = fuse.search(this.query)

    return results.slice(0, 9).map(r => r.item)
  }

  async search(query: string) {
    this.query = query.trim()

    await this.lock.acquireAsync()

    try {
      // another query was set before we got our chance
      if (this.query !== this.query) return
      await this._search()
    } finally {
      this.lock.release()
    }
  }

  async _search() {
    runInAction(() => {
      this.searchedTags = [
        'code',
        'dev',
        'javascript',
        'react',
        'typescript',
        'mobx',
        'mobx-state-tree',
        'mobx-react',
        'mobx-react-lite',
        'mobx-react-form',
      ]
    })
  }
}

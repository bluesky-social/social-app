import {makeAutoObservable, runInAction} from 'mobx'
import AwaitLock from 'await-lock'
import {RootStoreModel} from '../root-store'
import Fuse from 'fuse.js'

export class TagsAutocompleteView {
  // state
  isLoading = false
  isActive = false
  prefix = ''
  lock = new AwaitLock()

  searchedTags: string[] = []
  recentTags: string[] = [
    'js',
    'javascript',
    'art',
    'music',
  ]
  profileTags: string[] = [
    'bikes',
    'beer',
  ]

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get suggestions() {
    if (!this.isActive) {
      return []
    }

    const items = [
      ...this.recentTags,
      ...this.profileTags,
      ...this.searchedTags,
    ]

    if (!this.prefix) {
      return items.slice(0, 8)
    }

    const fuse = new Fuse(items)
    const results = fuse.search(this.prefix)

    return results.slice(0, 8).map(r => r.item)
  }

  setActive(v: boolean) {
    this.isActive = v
  }

  async setPrefix(prefix: string) {
    this.prefix = prefix.trim()
    await this.lock.acquireAsync()
    try {
      if (this.prefix) {
        if (this.prefix !== this.prefix) {
          return // another prefix was set before we got our chance
        }
        await this._search()
      } else {
        // this.searchRes = []
      }
    } finally {
      this.lock.release()
    }
  }

  // internal
  // =

  async _search() {
    runInAction(() => {
      this.searchedTags = [
        'code',
        'dev',
      ]
    })
  }
}

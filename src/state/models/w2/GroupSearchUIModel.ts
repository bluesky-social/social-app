import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from '../root-store'
import AwaitLock from 'await-lock'
import {GroupSearchItem} from 'w2-api/waverly_sdk'

export class GroupSearchUIModel {
  // data
  query: string = ''
  groups: GroupSearchItem[] = []
  lock = new AwaitLock()

  // state
  isLoading: boolean = false
  isActive = false

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }

  get suggestions() {
    if (!this.isActive || !this.query) {
      return []
    }
    return this.groups
  }

  setActive(v: boolean) {
    this.isActive = v
  }

  async setQuery(q: string) {
    const origQuery = q.trim()
    this.query = origQuery
    await this.lock.acquireAsync()
    try {
      if (this.query) {
        if (this.query !== origQuery) {
          return // another query was set before we got our chance
        }

        await this._fetch()
      } else {
        this.groups = []
      }
    } finally {
      this.lock.release()
    }
  }

  private async _fetch() {
    this.isLoading = true

    const res = await this.rootStore.waverlyAgent.searchGroup(this.query)

    runInAction(() => {
      this.groups = res
      this.isLoading = false
    })
  }
}

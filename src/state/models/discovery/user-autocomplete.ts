import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyActorDefs} from '@atproto/api'
import AwaitLock from 'await-lock'
import {RootStoreModel} from '../root-store'
import {isInvalidHandle} from 'lib/strings/handles'

interface Suggestion {
  handle: string
  displayName: string | undefined
  avatar: string | undefined
}

export class UserAutocompleteModel {
  // state
  isLoading = false
  isActive = false
  prefix = ''
  lock = new AwaitLock()

  // data
  searchRes: AppBskyActorDefs.ProfileViewBasic[] = []
  knownHandles: Set<string> = new Set()

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        knownHandles: false,
      },
      {autoBind: true},
    )
  }

  get follows(): Suggestion[] {
    return Object.values(this.rootStore.me.follows.byDid)
  }

  get suggestions(): Suggestion[] {
    if (!this.isActive) {
      return []
    }
    if (this.prefix) {
      const items: Suggestion[] = []
      for (const item of this.follows) {
        if (prefixMatch(this.prefix, item)) {
          items.push(item)
        }
      }
      for (const item of this.searchRes) {
        if (!items.find(item2 => item2.handle === item.handle)) {
          items.push({
            handle: item.handle,
            displayName: item.displayName,
            avatar: item.avatar,
          })
        }
      }
      return items
    }
    return this.follows
  }

  // public api
  // =

  async setup() {
    await this.rootStore.me.follows.syncIfNeeded()
    runInAction(() => {
      for (const did in this.rootStore.me.follows.byDid) {
        const info = this.rootStore.me.follows.byDid[did]
        if (!isInvalidHandle(info.handle)) {
          this.knownHandles.add(info.handle)
        }
      }
    })
  }

  setActive(v: boolean) {
    this.isActive = v
  }

  async setPrefix(prefix: string) {
    const origPrefix = prefix.trim().toLocaleLowerCase()
    this.prefix = origPrefix
    await this.lock.acquireAsync()
    try {
      if (this.prefix) {
        if (this.prefix !== origPrefix) {
          return // another prefix was set before we got our chance
        }
        await this._search()
      } else {
        this.searchRes = []
      }
    } finally {
      this.lock.release()
    }
  }

  // internal
  // =

  async _search() {
    const res = await this.rootStore.agent.searchActorsTypeahead({
      term: this.prefix,
      limit: 8,
    })
    runInAction(() => {
      this.searchRes = res.data.actors
      for (const u of this.searchRes) {
        this.knownHandles.add(u.handle)
      }
    })
  }
}

function prefixMatch(prefix: string, info: Suggestion): boolean {
  if (info.handle.includes(prefix)) {
    return true
  }
  if (info.displayName?.toLocaleLowerCase().includes(prefix)) {
    return true
  }
  return false
}

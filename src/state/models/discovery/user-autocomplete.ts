import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyActorDefs} from '@atproto/api'
import AwaitLock from 'await-lock'
import {RootStoreModel} from '../root-store'
import {isInvalidHandle} from 'lib/strings/handles'

type ProfileViewBasic = AppBskyActorDefs.ProfileViewBasic

export class UserAutocompleteModel {
  // state
  isLoading = false
  isActive = false
  prefix = ''
  lock = new AwaitLock()

  // data
  knownHandles: Set<string> = new Set()
  _suggestions: ProfileViewBasic[] = []

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

  get follows(): ProfileViewBasic[] {
    return Object.values(this.rootStore.me.follows.byDid).map(item => ({
      did: item.did,
      handle: item.handle,
      displayName: item.displayName,
      avatar: item.avatar,
    }))
  }

  get suggestions(): ProfileViewBasic[] {
    if (!this.isActive) {
      return []
    }
    return this._suggestions
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

        // reset to follow results
        this._computeSuggestions([])

        // ask backend
        const res = await this.rootStore.agent.searchActorsTypeahead({
          term: this.prefix,
          limit: 8,
        })
        this._computeSuggestions(res.data.actors)

        // update known handles
        runInAction(() => {
          for (const u of res.data.actors) {
            this.knownHandles.add(u.handle)
          }
        })
      } else {
        runInAction(() => {
          this._computeSuggestions([])
        })
      }
    } finally {
      this.lock.release()
    }
  }

  // internal
  // =

  _computeSuggestions(searchRes: AppBskyActorDefs.ProfileViewBasic[] = []) {
    if (this.prefix) {
      const items: ProfileViewBasic[] = []
      for (const item of this.follows) {
        if (prefixMatch(this.prefix, item)) {
          items.push(item)
        }
        if (items.length >= 8) {
          break
        }
      }
      for (const item of searchRes) {
        if (!items.find(item2 => item2.handle === item.handle)) {
          items.push({
            did: item.did,
            handle: item.handle,
            displayName: item.displayName,
            avatar: item.avatar,
          })
        }
      }
      this._suggestions = items
    } else {
      this._suggestions = this.follows
    }
  }
}

function prefixMatch(prefix: string, info: ProfileViewBasic): boolean {
  if (info.handle.includes(prefix)) {
    return true
  }
  if (info.displayName?.toLocaleLowerCase().includes(prefix)) {
    return true
  }
  return false
}

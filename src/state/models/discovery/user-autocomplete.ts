import {makeAutoObservable, runInAction} from 'mobx'
import {AppBskyActorDefs} from '@atproto/api'
import AwaitLock from 'await-lock'
import {RootStoreModel} from '../root-store'

export class UserAutocompleteModel {
  // state
  isLoading = false
  isActive = false
  prefix = ''
  lock = new AwaitLock()

  // data
  follows: AppBskyActorDefs.ProfileViewBasic[] = []
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

  get suggestions() {
    if (!this.isActive) {
      return []
    }
    if (this.prefix) {
      return this.searchRes.map(user => ({
        handle: user.handle,
        displayName: user.displayName,
        avatar: user.avatar,
      }))
    }
    return this.follows.map(follow => ({
      handle: follow.handle,
      displayName: follow.displayName,
      avatar: follow.avatar,
    }))
  }

  // public api
  // =

  async setup() {
    await this._getFollows()
  }

  setActive(v: boolean) {
    this.isActive = v
  }

  async setPrefix(prefix: string) {
    const origPrefix = prefix.trim()
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

  async _getFollows() {
    const res = await this.rootStore.agent.getFollows({
      actor: this.rootStore.me.did || '',
    })
    runInAction(() => {
      this.follows = res.data.follows
      for (const f of this.follows) {
        this.knownHandles.add(f.handle)
      }
    })
  }

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

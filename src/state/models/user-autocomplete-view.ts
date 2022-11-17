import {makeAutoObservable, runInAction} from 'mobx'
import * as GetFollows from '../../third-party/api/src/client/types/app/bsky/graph/getFollows'
import * as SearchTypeahead from '../../third-party/api/src/client/types/app/bsky/actor/searchTypeahead'
import {RootStoreModel} from './root-store'

export class UserAutocompleteViewModel {
  // state
  isLoading = false
  isActive = false
  prefix = ''
  _searchPromise: Promise<any> | undefined

  // data
  follows: GetFollows.OutputSchema['follows'] = []
  searchRes: SearchTypeahead.OutputSchema['users'] = []
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
      }))
    }
    return this.follows.map(follow => ({
      handle: follow.handle,
      displayName: follow.displayName,
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
    const origPrefix = prefix
    this.prefix = prefix.trim()
    if (this.prefix) {
      await this._searchPromise
      if (this.prefix !== origPrefix) {
        return // another prefix was set before we got our chance
      }
      this._searchPromise = this._search()
    } else {
      this.searchRes = []
    }
  }

  // internal
  // =

  private async _getFollows() {
    const res = await this.rootStore.api.app.bsky.graph.getFollows({
      user: this.rootStore.me.did || '',
    })
    runInAction(() => {
      this.follows = res.data.follows
      for (const f of this.follows) {
        this.knownHandles.add(f.handle)
      }
    })
  }

  private async _search() {
    const res = await this.rootStore.api.app.bsky.actor.searchTypeahead({
      term: this.prefix,
      limit: 8,
    })
    runInAction(() => {
      this.searchRes = res.data.users
      for (const u of this.searchRes) {
        this.knownHandles.add(u.handle)
      }
    })
  }
}

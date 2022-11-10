import {makeAutoObservable} from 'mobx'
import * as GetMemberships from '../../third-party/api/src/client/types/app/bsky/graph/getMemberships'
import {RootStoreModel} from './root-store'

type Subject = GetMemberships.OutputSchema['subject']
export type MembershipItem =
  GetMemberships.OutputSchema['memberships'][number] & {
    _reactKey: string
  }

export class MembershipsViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetMemberships.QueryParams

  // data
  subject: Subject = {did: '', handle: '', displayName: ''}
  memberships: MembershipItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetMemberships.QueryParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.params = params
  }

  get hasContent() {
    return this.subject.did !== ''
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  isMemberOf(did: string) {
    return !!this.memberships.find(m => m.did === did)
  }

  // public api
  // =

  async setup() {
    await this._fetch()
  }

  async refresh() {
    await this._fetch(true)
  }

  async loadMore() {
    // TODO
  }

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err: string = '') {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err
  }

  // loader functions
  // =

  private async _fetch(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.api.app.bsky.graph.getMemberships(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private _replaceAll(res: GetMemberships.Response) {
    this.subject.did = res.data.subject.did
    this.subject.handle = res.data.subject.handle
    this.subject.displayName = res.data.subject.displayName
    this.memberships.length = 0
    let counter = 0
    for (const item of res.data.memberships) {
      this._append({_reactKey: `item-${counter++}`, ...item})
    }
  }

  private _append(item: MembershipItem) {
    this.memberships.push(item)
  }
}

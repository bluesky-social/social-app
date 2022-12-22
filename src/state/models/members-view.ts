import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyGraphGetMembers as GetMembers,
  AppBskyActorRef as ActorRef,
  APP_BSKY_GRAPH,
} from '@atproto/api'
import {AtUri} from '../../third-party/uri'
import {RootStoreModel} from './root-store'

export type MemberItem = GetMembers.Member & {
  _reactKey: string
}

export class MembersViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetMembers.QueryParams

  // data
  subject: ActorRef.WithInfo = {
    did: '',
    handle: '',
    displayName: '',
    declaration: {cid: '', actorType: ''},
    avatar: undefined,
  }
  members: MemberItem[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetMembers.QueryParams,
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
    return this.members.length !== 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  isMember(did: string) {
    return this.members.find(member => member.did === did)
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

  async removeMember(did: string) {
    const assertsRes = await this.rootStore.api.app.bsky.graph.getAssertions({
      author: this.subject.did,
      subject: did,
      assertion: APP_BSKY_GRAPH.AssertMember,
    })
    if (assertsRes.data.assertions.length < 1) {
      throw new Error('Could not find membership record')
    }
    for (const assert of assertsRes.data.assertions) {
      await this.rootStore.api.app.bsky.graph.assertion.delete({
        did: this.subject.did,
        rkey: new AtUri(assert.uri).rkey,
      })
    }
    runInAction(() => {
      this.members = this.members.filter(m => m.did !== did)
    })
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
      const res = await this.rootStore.api.app.bsky.graph.getMembers(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load feed: ${e.toString()}`)
    }
  }

  private _replaceAll(res: GetMembers.Response) {
    this.subject.did = res.data.subject.did
    this.subject.handle = res.data.subject.handle
    this.subject.displayName = res.data.subject.displayName
    this.subject.declaration = res.data.subject.declaration
    this.subject.avatar = res.data.subject.avatar
    this.members.length = 0
    let counter = 0
    for (const item of res.data.members) {
      this._append({_reactKey: `item-${counter++}`, ...item})
    }
  }

  private _append(item: MemberItem) {
    this.members.push(item)
  }
}

import {makeAutoObservable} from 'mobx'
import {AppBskyGraphGetAssertions as GetAssertions} from '@atproto/api'
import {RootStoreModel} from './root-store'

export type Assertion = GetAssertions.Assertion & {
  _reactKey: string
}

export class GetAssertionsView {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetAssertions.QueryParams

  // data
  assertions: Assertion[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetAssertions.QueryParams,
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
    return this.assertions.length > 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  getBySubject(did: string) {
    return this.assertions.find(assertion => assertion.subject.did === did)
  }

  get confirmed() {
    return this.assertions.filter(assertion => !!assertion.confirmation)
  }

  get unconfirmed() {
    return this.assertions.filter(assertion => !assertion.confirmation)
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
      const res = await this.rootStore.api.app.bsky.graph.getAssertions(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private _replaceAll(res: GetAssertions.Response) {
    this.assertions.length = 0
    let counter = 0
    for (const item of res.data.assertions) {
      this._append({
        _reactKey: `item-${counter++}`,
        ...item,
      })
    }
  }

  private _append(item: Assertion) {
    this.assertions.push(item)
  }
}

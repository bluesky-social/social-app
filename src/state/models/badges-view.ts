import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from './root-store'

// TODO / DEBUG
// this is a temporary fake for the model until the view actually gets implemented in the bsky api
// -prf

export class BadgesViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get hasContent() {
    return false
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  async setup() {
    this.hasLoaded = true
  }

  async refresh() {}

  async loadMore() {}

  async update() {}
}

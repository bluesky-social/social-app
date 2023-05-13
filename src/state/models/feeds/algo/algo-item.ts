import {AppBskyFeedDefs} from '@atproto/api'
import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from 'state/models/root-store'

export class AlgoItemModel {
  // data
  data: AppBskyFeedDefs.GeneratorView

  constructor(
    public rootStore: RootStoreModel,
    view: AppBskyFeedDefs.GeneratorView,
  ) {
    this.data = view
    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  // local actions
  // =
  set toggleSaved(value: boolean) {
    console.log('toggleSaved', this.data.viewer)
    if (this.data.viewer) {
      this.data.viewer.saved = value
    }
  }

  // public apis
  // =
  async save() {
    try {
      this.toggleSaved = true
      await this.rootStore.agent.app.bsky.feed.saveFeed({
        feed: this.data.uri,
      })
    } catch (e: any) {
      this.rootStore.log.error('Failed to save feed', e)
    }
  }

  async unsave() {
    try {
      this.toggleSaved = false
      await this.rootStore.agent.app.bsky.feed.unsaveFeed({
        feed: this.data.uri,
      })
    } catch (e: any) {
      this.rootStore.log.error('Failed to unsanve feed', e)
    }
  }
}

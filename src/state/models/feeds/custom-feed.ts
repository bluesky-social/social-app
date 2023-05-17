import {AppBskyFeedDefs} from '@atproto/api'
import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from 'state/models/root-store'
import {sanitizeDisplayName} from 'lib/strings/display-names'

export class CustomFeedModel {
  // data
  _reactKey: string
  data: AppBskyFeedDefs.GeneratorView

  constructor(
    public rootStore: RootStoreModel,
    view: AppBskyFeedDefs.GeneratorView,
  ) {
    this._reactKey = view.uri
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

  get uri() {
    return this.data.uri
  }

  get displayName() {
    if (this.data.displayName) {
      return sanitizeDisplayName(this.data.displayName)
    }
    return `Feed by @${this.data.creator.handle}`
  }

  get isSaved() {
    return this.data.viewer?.saved
  }

  get isLiked() {
    return this.data.viewer?.like
  }

  // public apis
  // =

  async save() {
    await this.rootStore.agent.app.bsky.feed.saveFeed({
      feed: this.uri,
    })
    runInAction(() => {
      this.data.viewer = this.data.viewer || {}
      this.data.viewer.saved = true
    })
  }

  async unsave() {
    await this.rootStore.agent.app.bsky.feed.unsaveFeed({
      feed: this.uri,
    })
    runInAction(() => {
      this.data.viewer = this.data.viewer || {}
      this.data.viewer.saved = false
    })
  }

  async like() {
    try {
      const res = await this.rootStore.agent.like(this.data.uri, this.data.cid)
      runInAction(() => {
        this.data.viewer = this.data.viewer || {}
        this.data.viewer.like = res.uri
        this.data.likeCount = (this.data.likeCount || 0) + 1
      })
    } catch (e: any) {
      this.rootStore.log.error('Failed to like feed', e)
    }
  }

  async unlike() {
    if (!this.data.viewer.like) {
      return
    }
    try {
      await this.rootStore.agent.deleteLike(this.data.viewer.like!)
      runInAction(() => {
        this.data.viewer = this.data.viewer || {}
        this.data.viewer.like = undefined
        this.data.likeCount = (this.data.likeCount || 1) - 1
      })
    } catch (e: any) {
      this.rootStore.log.error('Failed to unlike feed', e)
    }
  }

  async reload() {
    const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerator({
      feed: this.data.uri,
    })
    runInAction(() => {
      this.data = res.data.view
    })
  }

  serialize() {
    return JSON.stringify(this.data)
  }
}

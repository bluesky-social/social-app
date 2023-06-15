import {AppBskyFeedDefs} from '@atproto/api'
import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from 'state/models/root-store'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {updateDataOptimistically} from 'lib/async/revertible'

export class CustomFeedModel {
  // data
  _reactKey: string
  data: AppBskyFeedDefs.GeneratorView
  isOnline: boolean
  isValid: boolean

  constructor(
    public rootStore: RootStoreModel,
    view: AppBskyFeedDefs.GeneratorView,
    isOnline?: boolean,
    isValid?: boolean,
  ) {
    this._reactKey = view.uri
    this.data = view
    this.isOnline = isOnline ?? true
    this.isValid = isValid ?? true
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
    return this.rootStore.preferences.savedFeeds.includes(this.uri)
  }

  get isLiked() {
    return this.data.viewer?.like
  }

  // public apis
  // =

  async save() {
    await this.rootStore.preferences.addSavedFeed(this.uri)
  }

  async unsave() {
    await this.rootStore.preferences.removeSavedFeed(this.uri)
  }

  async like() {
    try {
      await updateDataOptimistically(
        this.data,
        () => {
          this.data.viewer = this.data.viewer || {}
          this.data.viewer.like = 'pending'
          this.data.likeCount = (this.data.likeCount || 0) + 1
        },
        () => this.rootStore.agent.like(this.data.uri, this.data.cid),
        res => {
          this.data.viewer = this.data.viewer || {}
          this.data.viewer.like = res.uri
        },
      )
    } catch (e: any) {
      this.rootStore.log.error('Failed to like feed', e)
    }
  }

  async unlike() {
    if (!this.data.viewer?.like) {
      return
    }
    try {
      const likeUri = this.data.viewer.like
      await updateDataOptimistically(
        this.data,
        () => {
          this.data.viewer = this.data.viewer || {}
          this.data.viewer.like = undefined
          this.data.likeCount = (this.data.likeCount || 1) - 1
        },
        () => this.rootStore.agent.deleteLike(likeUri),
      )
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
      this.isOnline = res.data.isOnline
      this.isValid = res.data.isValid
    })
  }

  serialize() {
    return JSON.stringify(this.data)
  }
}

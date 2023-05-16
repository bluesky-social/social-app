import {AppBskyFeedDefs, AtUri} from '@atproto/api'
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

  get getUri() {
    return this.data.uri
  }

  get isSaved() {
    return this.data.viewer?.saved
  }

  get isLiked() {
    return this.data.viewer?.like
  }

  private toggleLiked(s?: string) {
    if (this.data.viewer) {
      if (this.data.viewer.like) {
        this.data.viewer.like = undefined
      } else {
        this.data.viewer.like = s
      }
    }
  }

  private incrementLike() {
    if (this.data.likeCount) {
      this.data.likeCount += 1
    } else {
      this.data.likeCount = 1
    }
  }

  private decrementLike() {
    if (this.data.likeCount) {
      this.data.likeCount -= 1
    } else {
      this.data.likeCount = 0
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

  async like() {
    try {
      const res = await this.rootStore.agent.app.bsky.feed.like.create(
        {
          repo: this.rootStore.me.did,
        },
        {
          subject: {
            uri: this.data.uri,
            cid: this.data.cid,
          },
          createdAt: new Date().toISOString(),
        },
      )
      this.toggleLiked(res.uri)
      this.incrementLike()
    } catch (e: any) {
      this.rootStore.log.error('Failed to like feed', e)
    }
  }

  async unlike() {
    try {
      await this.rootStore.agent.app.bsky.feed.like.delete({
        repo: this.rootStore.me.did,
        rkey: new AtUri(this.data.uri).rkey,
      })
      this.toggleLiked()
      this.decrementLike()
    } catch (e: any) {
      this.rootStore.log.error('Failed to unlike feed', e)
    }
  }

  static async getView(store: RootStoreModel, uri: string) {
    const res = await store.agent.app.bsky.feed.getFeedGenerator({
      feed: uri,
    })
    const view = res.data.view
    return view
  }

  async checkIsValid() {
    const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerator({
      feed: this.data.uri,
    })
    return res.data.isValid
  }

  async checkIsOnline() {
    const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerator({
      feed: this.data.uri,
    })
    return res.data.isOnline
  }

  async reload() {
    const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerator({
      feed: this.data.uri,
    })
    this.data = res.data.view
  }
}

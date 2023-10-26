import {AtUri, RichText, AppBskyFeedDefs, AppBskyGraphDefs} from '@atproto/api'
import {makeAutoObservable, runInAction} from 'mobx'
import {RootStoreModel} from 'state/models/root-store'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {bundleAsync} from 'lib/async/bundle'
import {cleanError} from 'lib/strings/errors'
import {track} from 'lib/analytics/analytics'

export class FeedSourceModel {
  // state
  _reactKey: string
  hasLoaded = false
  error: string | undefined

  // data
  uri: string
  cid: string = ''
  type: 'feed-generator' | 'list' | 'unsupported' = 'unsupported'
  avatar: string | undefined = ''
  displayName: string = ''
  descriptionRT: RichText | null = null
  creatorDid: string = ''
  creatorHandle: string = ''
  likeCount: number | undefined = 0
  likeUri: string | undefined = ''

  constructor(public rootStore: RootStoreModel, uri: string) {
    this._reactKey = uri
    this.uri = uri

    try {
      const urip = new AtUri(uri)
      if (urip.collection === 'app.bsky.feed.generator') {
        this.type = 'feed-generator'
      } else if (urip.collection === 'app.bsky.graph.list') {
        this.type = 'list'
      }
    } catch {}
    this.displayName = uri.split('/').pop() || ''

    makeAutoObservable(
      this,
      {
        rootStore: false,
      },
      {autoBind: true},
    )
  }

  get href() {
    const urip = new AtUri(this.uri)
    const collection =
      urip.collection === 'app.bsky.feed.generator' ? 'feed' : 'lists'
    return `/profile/${urip.hostname}/${collection}/${urip.rkey}`
  }

  get isSaved() {
    return this.rootStore.preferences.savedFeeds.includes(this.uri)
  }

  get isPinned() {
    return this.rootStore.preferences.isPinnedFeed(this.uri)
  }

  get isLiked() {
    return !!this.likeUri
  }

  get isOwner() {
    return this.creatorDid === this.rootStore.me.did
  }

  setup = bundleAsync(async () => {
    try {
      if (this.type === 'feed-generator') {
        const res = await this.rootStore.agent.app.bsky.feed.getFeedGenerator({
          feed: this.uri,
        })
        this.hydrateFeedGenerator(res.data.view)
      } else if (this.type === 'list') {
        const res = await this.rootStore.agent.app.bsky.graph.getList({
          list: this.uri,
          limit: 1,
        })
        this.hydrateList(res.data.list)
      }
    } catch (e) {
      runInAction(() => {
        this.error = cleanError(e)
      })
    }
  })

  hydrateFeedGenerator(view: AppBskyFeedDefs.GeneratorView) {
    this.uri = view.uri
    this.cid = view.cid
    this.avatar = view.avatar
    this.displayName = view.displayName
      ? sanitizeDisplayName(view.displayName)
      : `Feed by ${sanitizeHandle(view.creator.handle, '@')}`
    this.descriptionRT = new RichText({
      text: view.description || '',
      facets: (view.descriptionFacets || [])?.slice(),
    })
    this.creatorDid = view.creator.did
    this.creatorHandle = view.creator.handle
    this.likeCount = view.likeCount
    this.likeUri = view.viewer?.like
    this.hasLoaded = true
  }

  hydrateList(view: AppBskyGraphDefs.ListView) {
    this.uri = view.uri
    this.cid = view.cid
    this.avatar = view.avatar
    this.displayName = view.name
      ? sanitizeDisplayName(view.name)
      : `User List by ${sanitizeHandle(view.creator.handle, '@')}`
    this.descriptionRT = new RichText({
      text: view.description || '',
      facets: (view.descriptionFacets || [])?.slice(),
    })
    this.creatorDid = view.creator.did
    this.creatorHandle = view.creator.handle
    this.likeCount = undefined
    this.hasLoaded = true
  }

  async save() {
    if (this.type !== 'feed-generator') {
      return
    }
    try {
      await this.rootStore.preferences.addSavedFeed(this.uri)
    } catch (error) {
      this.rootStore.log.error('Failed to save feed', error)
    } finally {
      track('CustomFeed:Save')
    }
  }

  async unsave() {
    if (this.type !== 'feed-generator') {
      return
    }
    try {
      await this.rootStore.preferences.removeSavedFeed(this.uri)
    } catch (error) {
      this.rootStore.log.error('Failed to unsave feed', error)
    } finally {
      track('CustomFeed:Unsave')
    }
  }

  async pin() {
    try {
      await this.rootStore.preferences.addPinnedFeed(this.uri)
    } catch (error) {
      this.rootStore.log.error('Failed to pin feed', error)
    } finally {
      track('CustomFeed:Pin', {
        name: this.displayName,
        uri: this.uri,
      })
    }
  }

  async togglePin() {
    if (!this.isPinned) {
      track('CustomFeed:Pin', {
        name: this.displayName,
        uri: this.uri,
      })
      return this.rootStore.preferences.addPinnedFeed(this.uri)
    } else {
      track('CustomFeed:Unpin', {
        name: this.displayName,
        uri: this.uri,
      })
      return this.rootStore.preferences.removePinnedFeed(this.uri)
    }
  }

  async like() {
    if (this.type !== 'feed-generator') {
      return
    }
    try {
      this.likeUri = 'pending'
      this.likeCount = (this.likeCount || 0) + 1
      const res = await this.rootStore.agent.like(this.uri, this.cid)
      this.likeUri = res.uri
    } catch (e: any) {
      this.likeUri = undefined
      this.likeCount = (this.likeCount || 1) - 1
      this.rootStore.log.error('Failed to like feed', e)
    } finally {
      track('CustomFeed:Like')
    }
  }

  async unlike() {
    if (this.type !== 'feed-generator') {
      return
    }
    if (!this.likeUri) {
      return
    }
    const uri = this.likeUri
    try {
      this.likeUri = undefined
      this.likeCount = (this.likeCount || 1) - 1
      await this.rootStore.agent.deleteLike(uri!)
    } catch (e: any) {
      this.likeUri = uri
      this.likeCount = (this.likeCount || 0) + 1
      this.rootStore.log.error('Failed to unlike feed', e)
    } finally {
      track('CustomFeed:Unlike')
    }
  }
}

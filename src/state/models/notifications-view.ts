import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyNotificationList as ListNotifications,
  AppBskyActorRef as ActorRef,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedVote,
  AppBskyGraphAssertion,
  AppBskyGraphFollow,
} from '@atproto/api'
import {RootStoreModel} from './root-store'
import {PostThreadViewModel} from './post-thread-view'
import {cleanError} from '../../lib/strings'

const UNGROUPABLE_REASONS = ['assertion']
const PAGE_SIZE = 30
const MS_60MIN = 1e3 * 60 * 60

let _idCounter = 0

export interface GroupedNotification extends ListNotifications.Notification {
  additional?: ListNotifications.Notification[]
}

type SupportedRecord =
  | AppBskyFeedPost.Record
  | AppBskyFeedRepost.Record
  | AppBskyFeedVote.Record
  | AppBskyGraphAssertion.Record
  | AppBskyGraphFollow.Record

export class NotificationsViewItemModel {
  // ui state
  _reactKey: string = ''

  // data
  uri: string = ''
  cid: string = ''
  author: ActorRef.WithInfo = {
    did: '',
    handle: '',
    avatar: '',
    declaration: {cid: '', actorType: ''},
  }
  reason: string = ''
  reasonSubject?: string
  record?: SupportedRecord
  isRead: boolean = false
  indexedAt: string = ''
  additional?: NotificationsViewItemModel[]

  // additional data
  additionalPost?: PostThreadViewModel

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: GroupedNotification,
  ) {
    makeAutoObservable(this, {rootStore: false})
    this._reactKey = reactKey
    this.copy(v)
  }

  copy(v: GroupedNotification, preserve = false) {
    this.uri = v.uri
    this.cid = v.cid
    this.author = v.author
    this.reason = v.reason
    this.reasonSubject = v.reasonSubject
    this.record = this.toSupportedRecord(v.record)
    this.isRead = v.isRead
    this.indexedAt = v.indexedAt
    if (v.additional?.length) {
      this.additional = []
      for (const add of v.additional) {
        this.additional.push(
          new NotificationsViewItemModel(this.rootStore, '', add),
        )
      }
    } else if (!preserve) {
      this.additional = undefined
    }
  }

  get isUpvote() {
    return this.reason === 'vote'
  }

  get isRepost() {
    return this.reason === 'repost'
  }

  get isMention() {
    return this.reason === 'mention'
  }

  get isReply() {
    return this.reason === 'reply'
  }

  get isFollow() {
    return this.reason === 'follow'
  }

  get isAssertion() {
    return this.reason === 'assertion'
  }

  get needsAdditionalData() {
    if (this.isUpvote || this.isRepost || this.isReply || this.isMention) {
      return !this.additionalPost
    }
    return false
  }

  get subjectUri(): string {
    if (this.reasonSubject) {
      return this.reasonSubject
    }
    const record = this.record
    if (
      AppBskyFeedRepost.isRecord(record) ||
      AppBskyFeedVote.isRecord(record)
    ) {
      return record.subject.uri
    }
    return ''
  }

  toSupportedRecord(v: unknown): SupportedRecord | undefined {
    for (const ns of [
      AppBskyFeedPost,
      AppBskyFeedRepost,
      AppBskyFeedVote,
      AppBskyGraphAssertion,
      AppBskyGraphFollow,
    ]) {
      if (ns.isRecord(v)) {
        const valid = ns.validateRecord(v)
        if (valid.success) {
          return v
        } else {
          this.rootStore.log.warn('Received an invalid record', {
            record: v,
            error: valid.error,
          })
          return
        }
      }
    }
    this.rootStore.log.warn(
      'app.bsky.notifications.list served an unsupported record type',
      v,
    )
  }

  async fetchAdditionalData() {
    if (!this.needsAdditionalData) {
      return
    }
    let postUri
    if (this.isReply || this.isMention) {
      postUri = this.uri
    } else if (this.isUpvote || this.isRepost) {
      postUri = this.subjectUri
    }
    if (postUri) {
      this.additionalPost = new PostThreadViewModel(this.rootStore, {
        uri: postUri,
        depth: 0,
      })
      await this.additionalPost.setup().catch(e => {
        this.rootStore.log.error(
          'Failed to load post needed by notification',
          e,
        )
      })
    }
  }
}

export class NotificationsViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: ListNotifications.QueryParams
  hasMore = true
  loadMoreCursor?: string
  _loadPromise: Promise<void> | undefined
  _loadMorePromise: Promise<void> | undefined
  _updatePromise: Promise<void> | undefined

  // data
  notifications: NotificationsViewItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: ListNotifications.QueryParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
        _loadPromise: false,
        _loadMorePromise: false,
        _updatePromise: false,
      },
      {autoBind: true},
    )
    this.params = params
  }

  get hasContent() {
    return this.notifications.length !== 0
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  // public api
  // =

  /**
   * Load for first render
   */
  async setup(isRefreshing = false) {
    if (isRefreshing) {
      this.isRefreshing = true // set optimistically for UI
    }
    if (this._loadPromise) {
      return this._loadPromise
    }
    await this._pendingWork()
    this._loadPromise = this._initialLoad(isRefreshing)
    await this._loadPromise
    this._loadPromise = undefined
  }

  /**
   * Reset and load
   */
  async refresh() {
    return this.setup(true)
  }

  /**
   * Load more posts to the end of the notifications
   */
  async loadMore() {
    if (this._loadMorePromise) {
      return this._loadMorePromise
    }
    await this._pendingWork()
    this._loadMorePromise = this._loadMore()
    await this._loadMorePromise
    this._loadMorePromise = undefined
  }

  /**
   * Update content in-place
   */
  async update() {
    if (this._updatePromise) {
      return this._updatePromise
    }
    await this._pendingWork()
    this._updatePromise = this._update()
    await this._updatePromise
    this._updatePromise = undefined
  }

  /**
   * Update read/unread state
   */
  async updateReadState() {
    try {
      await this.rootStore.api.app.bsky.notification.updateSeen({
        seenAt: new Date().toISOString(),
      })
      this.rootStore.me.clearNotificationCount()
    } catch (e: any) {
      this.rootStore.log.warn('Failed to update notifications read state', e)
    }
  }

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(err)
    this.error = err ? cleanError(err) : ''
    if (err) {
      this.rootStore.log.error('Failed to fetch notifications', err)
    }
  }

  // loader functions
  // =

  private async _pendingWork() {
    if (this._loadPromise) {
      await this._loadPromise
    }
    if (this._loadMorePromise) {
      await this._loadMorePromise
    }
    if (this._updatePromise) {
      await this._updatePromise
    }
  }

  private async _initialLoad(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const params = Object.assign({}, this.params, {
        limit: PAGE_SIZE,
      })
      const res = await this.rootStore.api.app.bsky.notification.list(params)
      await this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private async _loadMore() {
    if (!this.hasMore) {
      return
    }
    this._xLoading()
    try {
      const params = Object.assign({}, this.params, {
        limit: PAGE_SIZE,
        before: this.loadMoreCursor,
      })
      const res = await this.rootStore.api.app.bsky.notification.list(params)
      await this._appendAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private async _update() {
    if (!this.notifications.length) {
      return
    }
    this._xLoading()
    let numToFetch = this.notifications.length
    let cursor = undefined
    try {
      do {
        const res: ListNotifications.Response =
          await this.rootStore.api.app.bsky.notification.list({
            before: cursor,
            limit: Math.min(numToFetch, 100),
          })
        if (res.data.notifications.length === 0) {
          break // sanity check
        }
        this._updateAll(res)
        numToFetch -= res.data.notifications.length
        cursor = this.notifications[res.data.notifications.length - 1].indexedAt
      } while (numToFetch > 0)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e)
    }
  }

  private async _replaceAll(res: ListNotifications.Response) {
    return this._appendAll(res, true)
  }

  private async _appendAll(res: ListNotifications.Response, replace = false) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    const promises = []
    const itemModels: NotificationsViewItemModel[] = []
    for (const item of groupNotifications(res.data.notifications)) {
      const itemModel = new NotificationsViewItemModel(
        this.rootStore,
        `item-${_idCounter++}`,
        item,
      )
      if (itemModel.needsAdditionalData) {
        promises.push(itemModel.fetchAdditionalData())
      }
      itemModels.push(itemModel)
    }
    await Promise.all(promises).catch(e => {
      this.rootStore.log.error(
        'Uncaught failure during notifications-view _appendAll()',
        e,
      )
    })
    runInAction(() => {
      if (replace) {
        this.notifications = itemModels
      } else {
        this.notifications = this.notifications.concat(itemModels)
      }
    })
  }

  private _updateAll(res: ListNotifications.Response) {
    for (const item of res.data.notifications) {
      const existingItem = this.notifications.find(
        // this find function has a key subtlety- the indexedAt comparison
        // the reason for this is reposts: they set the URI of the original post, not of the repost record
        // the indexedAt time will be for the repost however, so we use that to help us
        item2 => item.uri === item2.uri && item.indexedAt === item2.indexedAt,
      )
      if (existingItem) {
        existingItem.copy(item, true)
      }
    }
  }
}

function groupNotifications(
  items: ListNotifications.Notification[],
): GroupedNotification[] {
  const items2: GroupedNotification[] = []
  for (const item of items) {
    const ts = +new Date(item.indexedAt)
    let grouped = false
    if (!UNGROUPABLE_REASONS.includes(item.reason)) {
      for (const item2 of items2) {
        const ts2 = +new Date(item2.indexedAt)
        if (
          Math.abs(ts2 - ts) < MS_60MIN &&
          item.reason === item2.reason &&
          item.reasonSubject === item2.reasonSubject &&
          item.author.did !== item2.author.did
        ) {
          item2.additional = item2.additional || []
          item2.additional.push(item)
          grouped = true
          break
        }
      }
    }
    if (!grouped) {
      items2.push(item)
    }
  }
  return items2
}

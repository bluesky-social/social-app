import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyNotificationListNotifications as ListNotifications,
  AppBskyActorDefs,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedLike,
  AppBskyGraphFollow,
  ComAtprotoLabelDefs,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import {bundleAsync} from 'lib/async/bundle'
import {RootStoreModel} from '../root-store'
import {PostThreadModel} from '../content/post-thread'
import {cleanError} from 'lib/strings/errors'

const GROUPABLE_REASONS = ['like', 'repost', 'follow']
const PAGE_SIZE = 30
const MS_1HR = 1e3 * 60 * 60
const MS_2DAY = MS_1HR * 48

let _idCounter = 0

type CondFn = (notif: ListNotifications.Notification) => boolean

export interface GroupedNotification extends ListNotifications.Notification {
  additional?: ListNotifications.Notification[]
}

type SupportedRecord =
  | AppBskyFeedPost.Record
  | AppBskyFeedRepost.Record
  | AppBskyFeedLike.Record
  | AppBskyGraphFollow.Record

export class NotificationsFeedItemModel {
  // ui state
  _reactKey: string = ''

  // data
  uri: string = ''
  cid: string = ''
  author: AppBskyActorDefs.ProfileViewBasic = {
    did: '',
    handle: '',
    avatar: '',
  }
  reason: string = ''
  reasonSubject?: string
  record?: SupportedRecord
  isRead: boolean = false
  indexedAt: string = ''
  labels?: ComAtprotoLabelDefs.Label[]
  additional?: NotificationsFeedItemModel[]

  // additional data
  additionalPost?: PostThreadModel

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
    this.labels = v.labels
    if (v.additional?.length) {
      this.additional = []
      for (const add of v.additional) {
        this.additional.push(
          new NotificationsFeedItemModel(this.rootStore, '', add),
        )
      }
    } else if (!preserve) {
      this.additional = undefined
    }
  }

  get numUnreadInGroup(): number {
    if (this.additional?.length) {
      return (
        this.additional.reduce(
          (acc, notif) => acc + notif.numUnreadInGroup,
          0,
        ) + (this.isRead ? 0 : 1)
      )
    }
    return this.isRead ? 0 : 1
  }

  markGroupRead() {
    if (this.additional?.length) {
      for (const notif of this.additional) {
        notif.markGroupRead()
      }
    }
    this.isRead = true
  }

  get isLike() {
    return this.reason === 'like'
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

  get isQuote() {
    return this.reason === 'quote'
  }

  get isFollow() {
    return this.reason === 'follow'
  }

  get needsAdditionalData() {
    if (
      this.isLike ||
      this.isRepost ||
      this.isReply ||
      this.isQuote ||
      this.isMention
    ) {
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
      AppBskyFeedLike.isRecord(record)
    ) {
      return record.subject.uri
    }
    return ''
  }

  toSupportedRecord(v: unknown): SupportedRecord | undefined {
    for (const ns of [
      AppBskyFeedPost,
      AppBskyFeedRepost,
      AppBskyFeedLike,
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
    if (this.isReply || this.isQuote || this.isMention) {
      postUri = this.uri
    } else if (this.isLike || this.isRepost) {
      postUri = this.subjectUri
    }
    if (postUri) {
      this.additionalPost = new PostThreadModel(this.rootStore, {
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

export class NotificationsFeedModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  loadMoreError = ''
  hasMore = true
  loadMoreCursor?: string

  // used to linearize async modifications to state
  lock = new AwaitLock()

  // data
  notifications: NotificationsFeedItemModel[] = []
  queuedNotifications: undefined | ListNotifications.Notification[] = undefined
  unreadCount = 0

  // this is used to help trigger push notifications
  mostRecentNotificationUri: string | undefined

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        mostRecentNotificationUri: false,
      },
      {autoBind: true},
    )
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

  get hasNewLatest() {
    return this.queuedNotifications && this.queuedNotifications?.length > 0
  }

  // public api
  // =

  /**
   * Nuke all data
   */
  clear() {
    this.rootStore.log.debug('NotificationsModel:clear')
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = false
    this.error = ''
    this.hasMore = true
    this.loadMoreCursor = undefined
    this.notifications = []
    this.unreadCount = 0
    this.rootStore.emitUnreadNotifications(0)
    this.mostRecentNotificationUri = undefined
  }

  /**
   * Load for first render
   */
  setup = bundleAsync(async (isRefreshing: boolean = false) => {
    this.rootStore.log.debug('NotificationsModel:refresh', {isRefreshing})
    await this.lock.acquireAsync()
    try {
      this._xLoading(isRefreshing)
      try {
        const res = await this._fetchUntil(notif => notif.isRead, {
          breakAt: 'page',
        })
        await this._replaceAll(res)
        this._setQueued(undefined)
        this._countUnread()
        this._xIdle()
      } catch (e: any) {
        this._xIdle(e)
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Reset and load
   */
  async refresh() {
    this.isRefreshing = true // set optimistically for UI
    return this.setup(true)
  }

  /**
   * Sync the next set of notifications to show
   * returns true if the number changed
   */
  syncQueue = bundleAsync(async () => {
    this.rootStore.log.debug('NotificationsModel:syncQueue')
    await this.lock.acquireAsync()
    try {
      const res = await this._fetchUntil(
        notif =>
          this.notifications.length
            ? isEq(notif, this.notifications[0])
            : notif.isRead,
        {breakAt: 'record'},
      )
      this._setQueued(res.data.notifications)
      this._countUnread()
    } catch (e) {
      this.rootStore.log.error('NotificationsModel:syncQueue failed', {e})
    } finally {
      this.lock.release()
    }
  })

  /**
   *
   */
  processQueue = bundleAsync(async () => {
    this.rootStore.log.debug('NotificationsModel:processQueue')
    if (!this.queuedNotifications) {
      return
    }
    this.isRefreshing = true
    await this.lock.acquireAsync()
    try {
      runInAction(() => {
        this.mostRecentNotificationUri = this.queuedNotifications?.[0].uri
      })
      const itemModels = await this._processNotifications(
        this.queuedNotifications,
      )
      this._setQueued(undefined)
      runInAction(() => {
        this.notifications = itemModels.concat(this.notifications)
      })
    } catch (e) {
      this.rootStore.log.error('NotificationsModel:processQueue failed', {e})
    } finally {
      runInAction(() => {
        this.isRefreshing = false
      })
      this.lock.release()
    }
  })

  /**
   * Load more posts to the end of the notifications
   */
  loadMore = bundleAsync(async () => {
    if (!this.hasMore) {
      return
    }
    await this.lock.acquireAsync()
    try {
      this._xLoading()
      try {
        const res = await this.rootStore.agent.listNotifications({
          limit: PAGE_SIZE,
          cursor: this.loadMoreCursor,
        })
        await this._appendAll(res)
        this._xIdle()
      } catch (e: any) {
        this._xIdle(undefined, e)
        runInAction(() => {
          this.hasMore = false
        })
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Attempt to load more again after a failure
   */
  async retryLoadMore() {
    this.loadMoreError = ''
    this.hasMore = true
    return this.loadMore()
  }

  // unread notification in-place
  // =
  async update() {
    const promises = []
    for (const item of this.notifications) {
      if (item.additionalPost) {
        promises.push(item.additionalPost.update())
      }
    }
    await Promise.all(promises).catch(e => {
      this.rootStore.log.error(
        'Uncaught failure during notifications update()',
        e,
      )
    })
  }

  /**
   * Update read/unread state
   */
  async markAllUnqueuedRead() {
    try {
      for (const notif of this.notifications) {
        notif.markGroupRead()
      }
      this._countUnread()
      if (this.notifications[0]) {
        await this.rootStore.agent.updateSeenNotifications(
          this.notifications[0].indexedAt,
        )
      }
    } catch (e: any) {
      this.rootStore.log.warn('Failed to update notifications read state', e)
    }
  }

  async getNewMostRecent(): Promise<NotificationsFeedItemModel | undefined> {
    let old = this.mostRecentNotificationUri
    const res = await this.rootStore.agent.listNotifications({
      limit: 1,
    })
    if (!res.data.notifications[0] || old === res.data.notifications[0].uri) {
      return
    }
    this.mostRecentNotificationUri = res.data.notifications[0].uri
    const notif = new NotificationsFeedItemModel(
      this.rootStore,
      'mostRecent',
      res.data.notifications[0],
    )
    await notif.fetchAdditionalData()
    return notif
  }

  // state transitions
  // =

  _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  _xIdle(error?: any, loadMoreError?: any) {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = cleanError(error)
    this.loadMoreError = cleanError(loadMoreError)
    if (error) {
      this.rootStore.log.error('Failed to fetch notifications', error)
    }
    if (loadMoreError) {
      this.rootStore.log.error(
        'Failed to load more notifications',
        loadMoreError,
      )
    }
  }

  // helper functions
  // =

  async _fetchUntil(
    condFn: CondFn,
    {breakAt}: {breakAt: 'page' | 'record'},
  ): Promise<ListNotifications.Response> {
    const accRes: ListNotifications.Response = {
      success: true,
      headers: {},
      data: {cursor: undefined, notifications: []},
    }
    for (let i = 0; i <= 10; i++) {
      const res = await this.rootStore.agent.listNotifications({
        limit: PAGE_SIZE,
        cursor: accRes.data.cursor,
      })
      accRes.data.cursor = res.data.cursor

      let pageIsDone = false
      for (const notif of res.data.notifications) {
        if (condFn(notif)) {
          if (breakAt === 'record') {
            return accRes
          } else {
            pageIsDone = true
          }
        }
        accRes.data.notifications.push(notif)
      }
      if (pageIsDone || res.data.notifications.length < PAGE_SIZE) {
        return accRes
      }
    }
    return accRes
  }

  async _replaceAll(res: ListNotifications.Response) {
    if (res.data.notifications[0]) {
      this.mostRecentNotificationUri = res.data.notifications[0].uri
    }
    return this._appendAll(res, true)
  }

  async _appendAll(res: ListNotifications.Response, replace = false) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    const itemModels = await this._processNotifications(res.data.notifications)
    runInAction(() => {
      if (replace) {
        this.notifications = itemModels
      } else {
        this.notifications = this.notifications.concat(itemModels)
      }
    })
  }

  async _processNotifications(
    items: ListNotifications.Notification[],
  ): Promise<NotificationsFeedItemModel[]> {
    const promises = []
    const itemModels: NotificationsFeedItemModel[] = []
    items = items.filter(item => {
      return (
        this.rootStore.preferences.getLabelPreference(item.labels).pref !==
        'hide'
      )
    })
    for (const item of groupNotifications(items)) {
      const itemModel = new NotificationsFeedItemModel(
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
        'Uncaught failure during notifications _processNotifications()',
        e,
      )
    })
    return itemModels
  }

  _setQueued(queued: undefined | ListNotifications.Notification[]) {
    this.queuedNotifications = queued
  }

  _countUnread() {
    let unread = 0
    for (const notif of this.notifications) {
      unread += notif.numUnreadInGroup
    }
    if (this.queuedNotifications) {
      unread += this.queuedNotifications.length
    }
    this.unreadCount = unread
    this.rootStore.emitUnreadNotifications(unread)
  }
}

function groupNotifications(
  items: ListNotifications.Notification[],
): GroupedNotification[] {
  const items2: GroupedNotification[] = []
  for (const item of items) {
    const ts = +new Date(item.indexedAt)
    let grouped = false
    if (GROUPABLE_REASONS.includes(item.reason)) {
      for (const item2 of items2) {
        const ts2 = +new Date(item2.indexedAt)
        if (
          Math.abs(ts2 - ts) < MS_2DAY &&
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

type N = ListNotifications.Notification | NotificationsFeedItemModel
function isEq(a: N, b: N) {
  // this function has a key subtlety- the indexedAt comparison
  // the reason for this is reposts: they set the URI of the original post, not of the repost record
  // the indexedAt time will be for the repost however, so we use that to help us
  return a.uri === b.uri && a.indexedAt === b.indexedAt
}

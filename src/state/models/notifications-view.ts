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
import AwaitLock from 'await-lock'
import {bundleAsync} from 'lib/async/bundle'
import {RootStoreModel} from './root-store'
import {PostThreadViewModel} from './post-thread-view'
import {cleanError} from 'lib/strings/errors'

const GROUPABLE_REASONS = ['vote', 'repost', 'follow']
const PAGE_SIZE = 30
const MS_1HR = 1e3 * 60 * 60
const MS_2DAY = MS_1HR * 48

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

  // used to linearize async modifications to state
  private lock = new AwaitLock()

  // data
  notifications: NotificationsViewItemModel[] = []
  unreadCount = 0

  // this is used to help trigger push notifications
  mostRecentNotificationUri: string | undefined

  constructor(
    public rootStore: RootStoreModel,
    params: ListNotifications.QueryParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
        mostRecentNotificationUri: false,
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
    this.rootStore.log.debug('NotificationsModel:setup', {isRefreshing})
    if (isRefreshing) {
      this.isRefreshing = true // set optimistically for UI
    }
    await this.lock.acquireAsync()
    try {
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
    } finally {
      this.lock.release()
    }
  })

  /**
   * Reset and load
   */
  async refresh() {
    return this.setup(true)
  }

  /**
   * Load more posts to the end of the notifications
   */
  loadMore = bundleAsync(async () => {
    if (!this.hasMore) {
      return
    }
    this.lock.acquireAsync()
    try {
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
        this._xIdle() // don't bubble the error to the user
        this.rootStore.log.error('NotificationsView: Failed to load more', {
          params: this.params,
          e,
        })
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Load more posts at the start of the notifications
   */
  loadLatest = bundleAsync(async () => {
    if (this.notifications.length === 0 || this.unreadCount > PAGE_SIZE) {
      return this.refresh()
    }
    this.lock.acquireAsync()
    try {
      this._xLoading()
      try {
        const res = await this.rootStore.api.app.bsky.notification.list({
          limit: PAGE_SIZE,
        })
        await this._prependAll(res)
        this._xIdle()
      } catch (e: any) {
        this._xIdle() // don't bubble the error to the user
        this.rootStore.log.error('NotificationsView: Failed to load latest', {
          params: this.params,
          e,
        })
      }
    } finally {
      this.lock.release()
    }
  })

  /**
   * Update content in-place
   */
  update = bundleAsync(async () => {
    await this.lock.acquireAsync()
    try {
      if (!this.notifications.length) {
        return
      }
      this._xLoading()
      let numToFetch = this.notifications.length
      let cursor
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
          cursor = res.data.cursor
        } while (cursor && numToFetch > 0)
        this._xIdle()
      } catch (e: any) {
        this._xIdle() // don't bubble the error to the user
        this.rootStore.log.error('NotificationsView: Failed to update', {
          params: this.params,
          e,
        })
      }
    } finally {
      this.lock.release()
    }
  })

  // unread notification apis
  // =

  /**
   * Get the current number of unread notifications
   * returns true if the number changed
   */
  loadUnreadCount = bundleAsync(async () => {
    const old = this.unreadCount
    const res = await this.rootStore.api.app.bsky.notification.getCount()
    runInAction(() => {
      this.unreadCount = res.data.count
    })
    this.rootStore.emitUnreadNotifications(this.unreadCount)
    return this.unreadCount !== old
  })

  /**
   * Update read/unread state
   */
  async markAllRead() {
    try {
      this.unreadCount = 0
      this.rootStore.emitUnreadNotifications(0)
      for (const notif of this.notifications) {
        notif.isRead = true
      }
      await this.rootStore.api.app.bsky.notification.updateSeen({
        seenAt: new Date().toISOString(),
      })
    } catch (e: any) {
      this.rootStore.log.warn('Failed to update notifications read state', e)
    }
  }

  async getNewMostRecent(): Promise<NotificationsViewItemModel | undefined> {
    let old = this.mostRecentNotificationUri
    const res = await this.rootStore.api.app.bsky.notification.list({
      limit: 1,
    })
    if (!res.data.notifications[0] || old === res.data.notifications[0].uri) {
      return
    }
    this.mostRecentNotificationUri = res.data.notifications[0].uri
    const notif = new NotificationsViewItemModel(
      this.rootStore,
      'mostRecent',
      res.data.notifications[0],
    )
    await notif.fetchAdditionalData()
    return notif
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
    if (err) {
      this.rootStore.log.error('Failed to fetch notifications', err)
    }
  }

  // helper functions
  // =

  private async _replaceAll(res: ListNotifications.Response) {
    if (res.data.notifications[0]) {
      this.mostRecentNotificationUri = res.data.notifications[0].uri
    }
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

  private async _prependAll(res: ListNotifications.Response) {
    const promises = []
    const itemModels: NotificationsViewItemModel[] = []
    const dedupedNotifs = res.data.notifications.filter(
      n1 =>
        !this.notifications.find(
          n2 => isEq(n1, n2) || n2.additional?.find(n3 => isEq(n1, n3)),
        ),
    )
    for (const item of groupNotifications(dedupedNotifs)) {
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
        'Uncaught failure during notifications-view _prependAll()',
        e,
      )
    })
    runInAction(() => {
      this.notifications = itemModels.concat(this.notifications)
    })
  }

  private _updateAll(res: ListNotifications.Response) {
    for (const item of res.data.notifications) {
      const existingItem = this.notifications.find(item2 => isEq(item, item2))
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

type N = ListNotifications.Notification | NotificationsViewItemModel
function isEq(a: N, b: N) {
  // this function has a key subtlety- the indexedAt comparison
  // the reason for this is reposts: they set the URI of the original post, not of the repost record
  // the indexedAt time will be for the repost however, so we use that to help us
  return a.uri === b.uri && a.indexedAt === b.indexedAt
}

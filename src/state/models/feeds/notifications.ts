import {makeAutoObservable, runInAction} from 'mobx'
import {
  AppBskyNotificationListNotifications as ListNotifications,
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedLike,
  AppBskyGraphFollow,
  ComAtprotoLabelDefs,
} from '@atproto/api'
import AwaitLock from 'await-lock'
import chunk from 'lodash.chunk'
import {bundleAsync} from 'lib/async/bundle'
import {RootStoreModel} from '../root-store'
import {PostThreadModel} from '../content/post-thread'
import {cleanError} from 'lib/strings/errors'
import {
  PostLabelInfo,
  PostModeration,
  ModerationBehaviorCode,
} from 'lib/labeling/types'
import {
  getPostModeration,
  filterAccountLabels,
  filterProfileLabels,
} from 'lib/labeling/helpers'

const GROUPABLE_REASONS = ['like', 'repost', 'follow']
const PAGE_SIZE = 30
const MS_1HR = 1e3 * 60 * 60
const MS_2DAY = MS_1HR * 48

let _idCounter = 0

export const MAX_VISIBLE_NOTIFS = 30

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

  get labelInfo(): PostLabelInfo {
    const addedInfo = this.additionalPost?.thread?.labelInfo
    return {
      postLabels: (this.labels || []).concat(addedInfo?.postLabels || []),
      accountLabels: filterAccountLabels(this.author.labels).concat(
        addedInfo?.accountLabels || [],
      ),
      profileLabels: filterProfileLabels(this.author.labels).concat(
        addedInfo?.profileLabels || [],
      ),
      isMuted: this.author.viewer?.muted || addedInfo?.isMuted || false,
      mutedByList: this.author.viewer?.mutedByList || addedInfo?.mutedByList,
      isBlocking:
        !!this.author.viewer?.blocking || addedInfo?.isBlocking || false,
      isBlockedBy:
        !!this.author.viewer?.blockedBy || addedInfo?.isBlockedBy || false,
    }
  }

  get moderation(): PostModeration {
    return getPostModeration(this.rootStore, this.labelInfo)
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

  get additionalDataUri(): string | undefined {
    if (this.isReply || this.isQuote || this.isMention) {
      return this.uri
    } else if (this.isLike || this.isRepost) {
      return this.subjectUri
    }
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

  get reasonSubjectRootUri(): string | undefined {
    if (this.additionalPost) {
      return this.additionalPost.rootUri
    }
    return undefined
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

  setAdditionalData(additionalPost: AppBskyFeedDefs.PostView) {
    this.additionalPost = PostThreadModel.fromPostView(
      this.rootStore,
      additionalPost,
    )
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
  lastSync?: Date

  // used to linearize async modifications to state
  lock = new AwaitLock()

  // data
  notifications: NotificationsFeedItemModel[] = []
  queuedNotifications: undefined | NotificationsFeedItemModel[] = undefined
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

  get unreadCountLabel(): string {
    const count = this.unreadCount + this.rootStore.invitedUsers.numNotifs
    if (count >= MAX_VISIBLE_NOTIFS) {
      return `${MAX_VISIBLE_NOTIFS}+`
    }
    if (count === 0) {
      return ''
    }
    return String(count)
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
        const res = await this.rootStore.agent.listNotifications({
          limit: PAGE_SIZE,
        })
        await this._replaceAll(res)
        runInAction(() => {
          this.lastSync = new Date()
        })
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
   */
  syncQueue = bundleAsync(async () => {
    this.rootStore.log.debug('NotificationsModel:syncQueue')
    if (this.unreadCount >= MAX_VISIBLE_NOTIFS) {
      return // no need to check
    }
    await this.lock.acquireAsync()
    try {
      const res = await this.rootStore.agent.listNotifications({
        limit: PAGE_SIZE,
      })

      const queue = []
      for (const notif of res.data.notifications) {
        if (this.notifications.length) {
          if (isEq(notif, this.notifications[0])) {
            break
          }
        } else {
          if (!notif.isRead) {
            break
          }
        }
        queue.push(notif)
      }

      // NOTE
      // because filtering depends on the added information we have to fetch
      // the full models here. this is *not* ideal performance and we need
      // to update the notifications route to give all the info we need
      // -prf
      const queueModels = await this._fetchItemModels(queue)
      this._setQueued(this._filterNotifications(queueModels))
      this._countUnread()
    } catch (e) {
      this.rootStore.log.error('NotificationsModel:syncQueue failed', {e})
    } finally {
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
  async markAllRead() {
    try {
      for (const notif of this.notifications) {
        notif.markGroupRead()
      }
      this._countUnread()
      await this.rootStore.agent.updateSeenNotifications(
        this.lastSync ? this.lastSync.toISOString() : undefined,
      )
    } catch (e: any) {
      this.rootStore.log.warn('Failed to update notifications read state', e)
    }
  }

  /**
   * Used in background fetch to trigger notifications
   */
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
    const addedUri = notif.additionalDataUri
    if (addedUri) {
      const postsRes = await this.rootStore.agent.app.bsky.feed.getPosts({
        uris: [addedUri],
      })
      notif.setAdditionalData(postsRes.data.posts[0])
    }
    const filtered = this._filterNotifications([notif])
    return filtered[0]
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

  _filterNotifications(
    items: NotificationsFeedItemModel[],
  ): NotificationsFeedItemModel[] {
    return items
      .filter(item => {
        const hideByLabel =
          item.moderation.list.behavior === ModerationBehaviorCode.Hide
        let mutedThread = !!(
          item.reasonSubjectRootUri &&
          this.rootStore.mutedThreads.uris.has(item.reasonSubjectRootUri)
        )
        return !hideByLabel && !mutedThread
      })
      .map(item => {
        if (item.additional?.length) {
          item.additional = this._filterNotifications(item.additional)
        }
        return item
      })
  }

  async _fetchItemModels(
    items: ListNotifications.Notification[],
  ): Promise<NotificationsFeedItemModel[]> {
    // construct item models and track who needs more data
    const itemModels: NotificationsFeedItemModel[] = []
    const addedPostMap = new Map<string, NotificationsFeedItemModel[]>()
    for (const item of items) {
      const itemModel = new NotificationsFeedItemModel(
        this.rootStore,
        `item-${_idCounter++}`,
        item,
      )
      const uri = itemModel.additionalDataUri
      if (uri) {
        const models = addedPostMap.get(uri) || []
        models.push(itemModel)
        addedPostMap.set(uri, models)
      }
      itemModels.push(itemModel)
    }

    // fetch additional data
    if (addedPostMap.size > 0) {
      const uriChunks = chunk(Array.from(addedPostMap.keys()), 25)
      const postsChunks = await Promise.all(
        uriChunks.map(uris =>
          this.rootStore.agent.app.bsky.feed
            .getPosts({uris})
            .then(res => res.data.posts),
        ),
      )
      for (const post of postsChunks.flat()) {
        const models = addedPostMap.get(post.uri)
        if (models?.length) {
          for (const model of models) {
            model.setAdditionalData(post)
          }
        }
      }
    }

    return itemModels
  }

  async _processNotifications(
    items: ListNotifications.Notification[],
  ): Promise<NotificationsFeedItemModel[]> {
    const itemModels = await this._fetchItemModels(groupNotifications(items))
    return this._filterNotifications(itemModels)
  }

  _setQueued(queued: undefined | NotificationsFeedItemModel[]) {
    this.queuedNotifications = queued
  }

  _countUnread() {
    let unread = 0
    for (const notif of this.notifications) {
      unread += notif.numUnreadInGroup
    }
    if (this.queuedNotifications) {
      unread += this.queuedNotifications.filter(notif => !notif.isRead).length
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

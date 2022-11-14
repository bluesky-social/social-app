import {makeAutoObservable} from 'mobx'
import * as ListNotifications from '../../third-party/api/src/client/types/app/bsky/notification/list'
import {RootStoreModel} from './root-store'
import {Declaration} from './_common'
import {hasProp} from '../lib/type-guards'
import {APP_BSKY_GRAPH} from '../../third-party/api'

const UNGROUPABLE_REASONS = ['trend', 'assertion']

export interface GroupedNotification extends ListNotifications.Notification {
  additional?: ListNotifications.Notification[]
}

export class NotificationsViewItemModel implements GroupedNotification {
  // ui state
  _reactKey: string = ''

  // data
  uri: string = ''
  cid: string = ''
  author: {
    did: string
    handle: string
    displayName?: string
    declaration: Declaration
  } = {did: '', handle: '', declaration: {cid: '', actorType: ''}}
  reason: string = ''
  reasonSubject?: string
  record: any = {}
  isRead: boolean = false
  indexedAt: string = ''
  additional?: NotificationsViewItemModel[]

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: GroupedNotification,
  ) {
    makeAutoObservable(this, {rootStore: false})
    this._reactKey = reactKey
    this.copy(v)
  }

  copy(v: GroupedNotification) {
    this.uri = v.uri
    this.cid = v.cid
    this.author = v.author
    this.reason = v.reason
    this.reasonSubject = v.reasonSubject
    this.record = v.record
    this.isRead = v.isRead
    this.indexedAt = v.indexedAt
    if (v.additional?.length) {
      this.additional = []
      for (const add of v.additional) {
        this.additional.push(
          new NotificationsViewItemModel(this.rootStore, '', add),
        )
      }
    } else {
      this.additional = undefined
    }
  }

  get isUpvote() {
    return this.reason === 'vote'
  }

  get isRepost() {
    return this.reason === 'repost'
  }

  get isTrend() {
    return this.reason === 'trend'
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

  get isInvite() {
    return (
      this.isAssertion && this.record.assertion === APP_BSKY_GRAPH.AssertMember
    )
  }

  get subjectUri() {
    if (this.reasonSubject) {
      return this.reasonSubject
    }
    if (
      hasProp(this.record, 'subject') &&
      typeof this.record.subject === 'string'
    ) {
      return this.record.subject
    }
    return ''
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
    if (this._loadPromise) {
      return this._loadPromise
    }
    await this._pendingWork()
    this._loadPromise = this._initialLoad(isRefreshing)
    await this._loadPromise
    this._updateReadState()
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

  // state transitions
  // =

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err: string = '') {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err
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
      const res = await this.rootStore.api.app.bsky.notification.list(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load notifications: ${e.toString()}`)
    }
  }

  private async _loadMore() {
    if (!this.hasMore) {
      return
    }
    this._xLoading()
    try {
      const params = Object.assign({}, this.params, {
        before: this.loadMoreCursor,
      })
      const res = await this.rootStore.api.app.bsky.notification.list(params)
      this._appendAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load notifications: ${e.toString()}`)
    }
  }

  private async _update() {
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
        console.log(numToFetch, cursor, res.data.notifications.length)
      } while (numToFetch > 0)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to update notifications: ${e.toString()}`)
    }
  }

  private _replaceAll(res: ListNotifications.Response) {
    this.notifications.length = 0
    this._appendAll(res)
  }

  private _appendAll(res: ListNotifications.Response) {
    this.loadMoreCursor = res.data.cursor
    this.hasMore = !!this.loadMoreCursor
    let counter = this.notifications.length
    for (const item of groupNotifications(res.data.notifications)) {
      this._append(counter++, item)
    }
  }

  private _append(keyId: number, item: GroupedNotification) {
    // TODO: validate .record
    this.notifications.push(
      new NotificationsViewItemModel(this.rootStore, `item-${keyId}`, item),
    )
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
        existingItem.copy(item)
      }
    }
  }

  private async _updateReadState() {
    try {
      await this.rootStore.api.app.bsky.notification.updateSeen({
        seenAt: new Date().toISOString(),
      })
    } catch (e) {
      console.log('Failed to update notifications read state', e)
    }
  }
}

function groupNotifications(
  items: ListNotifications.Notification[],
): GroupedNotification[] {
  const items2: GroupedNotification[] = []
  for (const item of items) {
    let grouped = false
    if (!UNGROUPABLE_REASONS.includes(item.reason)) {
      for (const item2 of items2) {
        if (
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

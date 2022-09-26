import {makeAutoObservable} from 'mobx'
import * as GetNotifications from '../../third-party/api/src/types/todo/social/getNotifications'
import {RootStoreModel} from './root-store'
import {hasProp} from '../lib/type-guards'

export class NotificationsViewItemModel
  implements GetNotifications.Notification
{
  // ui state
  _reactKey: string = ''

  // data
  uri: string = ''
  author: {
    did: string
    name: string
    displayName: string
  } = {did: '', name: '', displayName: ''}
  record: any = {}
  isRead: boolean = false
  indexedAt: string = ''

  constructor(
    public rootStore: RootStoreModel,
    reactKey: string,
    v: GetNotifications.Notification,
  ) {
    makeAutoObservable(this, {rootStore: false})
    this._reactKey = reactKey
    this.copy(v)
  }

  copy(v: GetNotifications.Notification) {
    this.uri = v.uri
    this.author = v.author
    this.record = v.record
    this.isRead = v.isRead
    this.indexedAt = v.indexedAt
  }

  get isLike() {
    return (
      hasProp(this.record, '$type') && this.record.$type === 'todo.social.like'
    )
  }

  get isRepost() {
    return (
      hasProp(this.record, '$type') &&
      this.record.$type === 'todo.social.repost'
    )
  }

  get isReply() {
    return (
      hasProp(this.record, '$type') && this.record.$type === 'todo.social.post'
    )
  }

  get isFollow() {
    return (
      hasProp(this.record, '$type') &&
      this.record.$type === 'todo.social.follow'
    )
  }

  get subjectUri() {
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
  params: GetNotifications.QueryParams
  _loadPromise: Promise<void> | undefined
  _loadMorePromise: Promise<void> | undefined
  _updatePromise: Promise<void> | undefined

  // data
  notifications: NotificationsViewItemModel[] = []

  constructor(
    public rootStore: RootStoreModel,
    params: GetNotifications.QueryParams,
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

  get loadMoreCursor() {
    if (this.hasContent) {
      return this.notifications[this.notifications.length - 1].indexedAt
    }
    return undefined
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
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    try {
      const res = await this.rootStore.api.todo.social.getNotifications(
        this.params,
      )
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load notifications: ${e.toString()}`)
    }
  }

  private async _loadMore() {
    this._xLoading()
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    try {
      const params = Object.assign({}, this.params, {
        before: this.loadMoreCursor,
      })
      const res = await this.rootStore.api.todo.social.getNotifications(params)
      this._appendAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(`Failed to load notifications: ${e.toString()}`)
    }
  }

  private async _update() {
    this._xLoading()
    await new Promise(r => setTimeout(r, 250)) // DEBUG
    let numToFetch = this.notifications.length
    let cursor = undefined
    try {
      do {
        const res: GetNotifications.Response =
          await this.rootStore.api.todo.social.getNotifications({
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

  private _replaceAll(res: GetNotifications.Response) {
    this.notifications.length = 0
    this._appendAll(res)
  }

  private _appendAll(res: GetNotifications.Response) {
    let counter = this.notifications.length
    for (const item of res.data.notifications) {
      this._append(counter++, item)
    }
  }

  private _append(keyId: number, item: GetNotifications.Notification) {
    // TODO: validate .record
    this.notifications.push(
      new NotificationsViewItemModel(this.rootStore, `item-${keyId}`, item),
    )
  }

  private _updateAll(res: GetNotifications.Response) {
    for (const item of res.data.notifications) {
      const existingItem = this.notifications.find(
        // this find function has a key subtley- the indexedAt comparison
        // the reason for this is reposts: they set the URI of the original post, not of the repost record
        // the indexedAt time will be for the repost however, so we use that to help us
        item2 => item.uri === item2.uri && item.indexedAt === item2.indexedAt,
      )
      if (existingItem) {
        existingItem.copy(item)
      }
    }
  }
}

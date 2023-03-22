/**
 * The root store is the base of all modeled state.
 */

import {makeAutoObservable, runInAction} from 'mobx'
import {AtpAgent} from '@atproto/api'
import {createContext, useContext} from 'react'
import {DeviceEventEmitter, EmitterSubscription} from 'react-native'
import * as BgScheduler from 'lib/bg-scheduler'
import {z} from 'zod'
import {isObj, hasProp} from 'lib/type-guards'
import {LogModel} from './log'
import {SessionModel} from './session'
import {ShellUiModel} from './ui/shell'
import {ProfilesViewModel} from './profiles-view'
import {LinkMetasCache} from './cache/link-metas'
import {NotificationsViewItemModel} from './notifications-view'
import {MeModel} from './me'
import {PreferencesModel} from './ui/preferences'
import {resetToTab} from '../../Navigation'
import {ImageSizesCache} from './cache/image-sizes'

export const appInfo = z.object({
  build: z.string(),
  name: z.string(),
  namespace: z.string(),
  version: z.string(),
})
export type AppInfo = z.infer<typeof appInfo>

export class RootStoreModel {
  agent: AtpAgent
  appInfo?: AppInfo
  log = new LogModel()
  session = new SessionModel(this)
  shell = new ShellUiModel(this)
  preferences = new PreferencesModel()
  me = new MeModel(this)
  profiles = new ProfilesViewModel(this)
  linkMetas = new LinkMetasCache(this)
  imageSizes = new ImageSizesCache()

  // HACK
  // this flag is to track the lexicon breaking refactor
  // it should be removed once we get that done
  // -prf
  hackUpgradeNeeded = false
  async hackCheckIfUpgradeNeeded() {
    try {
      this.log.debug('hackCheckIfUpgradeNeeded()')
      const res = await fetch('https://bsky.social/xrpc/app.bsky.feed.getLikes')
      await res.text()
      runInAction(() => {
        this.hackUpgradeNeeded = res.status !== 501
        this.log.debug(
          `hackCheckIfUpgradeNeeded() said ${this.hackUpgradeNeeded}`,
        )
      })
    } catch (e) {
      this.log.error('Failed to hackCheckIfUpgradeNeeded', {e})
    }
  }

  constructor(agent: AtpAgent) {
    this.agent = agent
    makeAutoObservable(this, {
      api: false,
      serialize: false,
      hydrate: false,
    })
    this.initBgFetch()
  }

  get api() {
    return this.agent.api
  }

  setAppInfo(info: AppInfo) {
    this.appInfo = info
  }

  serialize(): unknown {
    return {
      appInfo: this.appInfo,
      session: this.session.serialize(),
      me: this.me.serialize(),
      shell: this.shell.serialize(),
      preferences: this.preferences.serialize(),
    }
  }

  hydrate(v: unknown) {
    if (isObj(v)) {
      if (hasProp(v, 'appInfo')) {
        const appInfoParsed = appInfo.safeParse(v.appInfo)
        if (appInfoParsed.success) {
          this.setAppInfo(appInfoParsed.data)
        }
      }
      if (hasProp(v, 'me')) {
        this.me.hydrate(v.me)
      }
      if (hasProp(v, 'session')) {
        this.session.hydrate(v.session)
      }
      if (hasProp(v, 'shell')) {
        this.shell.hydrate(v.shell)
      }
      if (hasProp(v, 'preferences')) {
        this.preferences.hydrate(v.preferences)
      }
    }
  }

  /**
   * Called during init to resume any stored session.
   */
  async attemptSessionResumption() {
    this.log.debug('RootStoreModel:attemptSessionResumption')
    try {
      await this.session.attemptSessionResumption()
      this.log.debug('Session initialized', {
        hasSession: this.session.hasSession,
      })
      this.updateSessionState()
    } catch (e: any) {
      this.log.warn('Failed to initialize session', e)
    }
  }

  /**
   * Called by the session model. Refreshes session-oriented state.
   */
  async handleSessionChange(agent: AtpAgent) {
    this.log.debug('RootStoreModel:handleSessionChange')
    this.agent = agent
    this.me.clear()
    await this.me.load()
  }

  /**
   * Called by the session model. Handles session drops by informing the user.
   */
  async handleSessionDrop() {
    this.log.debug('RootStoreModel:handleSessionDrop')
    resetToTab('HomeTab')
    this.me.clear()
    this.emitSessionDropped()
  }

  /**
   * Clears all session-oriented state.
   */
  clearAllSessionState() {
    this.log.debug('RootStoreModel:clearAllSessionState')
    this.session.clear()
    resetToTab('HomeTab')
    this.me.clear()
  }

  /**
   * Periodic poll for new session state.
   */
  async updateSessionState() {
    if (!this.session.hasSession) {
      return
    }
    try {
      await this.me.notifications.loadUnreadCount()
      await this.me.follows.fetchIfNeeded()
    } catch (e: any) {
      this.log.error('Failed to fetch latest state', e)
    }
  }

  // global event bus
  // =
  // - some events need to be passed around between views and models
  //   in order to keep state in sync; these methods are for that

  // a post was deleted by the local user
  onPostDeleted(handler: (uri: string) => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('post-deleted', handler)
  }
  emitPostDeleted(uri: string) {
    DeviceEventEmitter.emit('post-deleted', uri)
  }

  // the session has started and been fully hydrated
  onSessionLoaded(handler: () => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('session-loaded', handler)
  }
  emitSessionLoaded() {
    DeviceEventEmitter.emit('session-loaded')
  }

  // the session was dropped due to bad/expired refresh tokens
  onSessionDropped(handler: () => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('session-dropped', handler)
  }
  emitSessionDropped() {
    DeviceEventEmitter.emit('session-dropped')
  }

  // the current screen has changed
  // TODO is this still needed?
  onNavigation(handler: () => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('navigation', handler)
  }
  emitNavigation() {
    DeviceEventEmitter.emit('navigation')
  }

  // a "soft reset" typically means scrolling to top and loading latest
  // but it can depend on the screen
  onScreenSoftReset(handler: () => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('screen-soft-reset', handler)
  }
  emitScreenSoftReset() {
    DeviceEventEmitter.emit('screen-soft-reset')
  }

  // the unread notifications count has changed
  onUnreadNotifications(handler: (count: number) => void): EmitterSubscription {
    return DeviceEventEmitter.addListener('unread-notifications', handler)
  }
  emitUnreadNotifications(count: number) {
    DeviceEventEmitter.emit('unread-notifications', count)
  }

  // a notification has been queued for push
  onPushNotification(
    handler: (notif: NotificationsViewItemModel) => void,
  ): EmitterSubscription {
    return DeviceEventEmitter.addListener('push-notification', handler)
  }
  emitPushNotification(notif: NotificationsViewItemModel) {
    DeviceEventEmitter.emit('push-notification', notif)
  }

  // background fetch
  // =
  // - we use this to poll for unread notifications, which is not "ideal" behavior but
  //   gives us a solution for push-notifications that work against any pds

  initBgFetch() {
    // NOTE
    // background fetch runs every 15 minutes *at most* and will get slowed down
    // based on some heuristics run by iOS, meaning it is not a reliable form of delivery
    // -prf
    BgScheduler.configure(
      this.onBgFetch.bind(this),
      this.onBgFetchTimeout.bind(this),
    ).then(status => {
      this.log.debug(`Background fetch initiated, status: ${status}`)
    })
  }

  async onBgFetch(taskId: string) {
    this.log.debug(`Background fetch fired for task ${taskId}`)
    if (this.session.hasSession) {
      const res = await this.api.app.bsky.notification.getCount()
      const hasNewNotifs = this.me.notifications.unreadCount !== res.data.count
      this.emitUnreadNotifications(res.data.count)
      this.log.debug(
        `Background fetch received unread count = ${res.data.count}`,
      )
      if (hasNewNotifs) {
        this.log.debug(
          'Background fetch detected potentially a new notification',
        )
        const mostRecent = await this.me.notifications.getNewMostRecent()
        if (mostRecent) {
          this.log.debug('Got the notification, triggering a push')
          this.emitPushNotification(mostRecent)
        }
      }
    }
    BgScheduler.finish(taskId)
  }

  onBgFetchTimeout(taskId: string) {
    this.log.debug(`Background fetch timed out for task ${taskId}`)
    BgScheduler.finish(taskId)
  }
}

const throwawayInst = new RootStoreModel(
  new AtpAgent({service: 'http://localhost'}),
) // this will be replaced by the loader, we just need to supply a value at init
const RootStoreContext = createContext<RootStoreModel>(throwawayInst)
export const RootStoreProvider = RootStoreContext.Provider
export const useStores = () => useContext(RootStoreContext)

/**
 * The root store is the base of all modeled state.
 */

import {makeAutoObservable} from 'mobx'
import {BskyAgent} from '@atproto/api'
import {createContext, useContext} from 'react'
import {DeviceEventEmitter, EmitterSubscription} from 'react-native'
import * as BgScheduler from 'lib/bg-scheduler'
import {z} from 'zod'
import {isObj, hasProp} from 'lib/type-guards'
import {LogModel} from './log'
import {SessionModel} from './session'
import {ShellUiModel} from './ui/shell'
import {ProfilesCache} from './cache/profiles-view'
import {LinkMetasCache} from './cache/link-metas'
import {NotificationsFeedItemModel} from './feeds/notifications'
import {MeModel} from './me'
import {InvitedUsers} from './invited-users'
import {PreferencesModel} from './ui/preferences'
import {resetToTab} from '../../Navigation'
import {ImageSizesCache} from './cache/image-sizes'
import {MutedThreads} from './muted-threads'
import {reset as resetNavigation} from '../../Navigation'

export const appInfo = z.object({
  build: z.string(),
  name: z.string(),
  namespace: z.string(),
  version: z.string(),
})
export type AppInfo = z.infer<typeof appInfo>

export class RootStoreModel {
  agent: BskyAgent
  appInfo?: AppInfo
  log = new LogModel()
  session = new SessionModel(this)
  shell = new ShellUiModel(this)
  preferences = new PreferencesModel()
  me = new MeModel(this)
  invitedUsers = new InvitedUsers(this)
  profiles = new ProfilesCache(this)
  linkMetas = new LinkMetasCache(this)
  imageSizes = new ImageSizesCache()
  mutedThreads = new MutedThreads()

  constructor(agent: BskyAgent) {
    this.agent = agent
    makeAutoObservable(this, {
      agent: false,
      serialize: false,
      hydrate: false,
    })
    this.initBgFetch()
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
      invitedUsers: this.invitedUsers.serialize(),
      mutedThreads: this.mutedThreads.serialize(),
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
      if (hasProp(v, 'invitedUsers')) {
        this.invitedUsers.hydrate(v.invitedUsers)
      }
      if (hasProp(v, 'mutedThreads')) {
        this.mutedThreads.hydrate(v.mutedThreads)
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
  async handleSessionChange(
    agent: BskyAgent,
    {hadSession}: {hadSession: boolean},
  ) {
    this.log.debug('RootStoreModel:handleSessionChange')
    this.agent = agent
    this.me.clear()
    await this.me.load()
    if (!hadSession) {
      resetNavigation()
    }
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
      await this.me.updateIfNeeded()
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
    handler: (notif: NotificationsFeedItemModel) => void,
  ): EmitterSubscription {
    return DeviceEventEmitter.addListener('push-notification', handler)
  }
  emitPushNotification(notif: NotificationsFeedItemModel) {
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
      const res = await this.agent.countUnreadNotifications()
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
  new BskyAgent({service: 'http://localhost'}),
) // this will be replaced by the loader, we just need to supply a value at init
const RootStoreContext = createContext<RootStoreModel>(throwawayInst)
export const RootStoreProvider = RootStoreContext.Provider
export const useStores = () => useContext(RootStoreContext)

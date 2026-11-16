/**
 * Polls for unread notifications, for the badges and the Notifications
 * screen's "Refresh" pill, and marks notifications as seen.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {AppState} from 'react-native'
import {type ISODatetimeString} from '@atproto/syntax'

import BroadcastChannel from '#/lib/broadcast'
import {resetBadgeCount} from '#/lib/notifications/notifications'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useAppviewClient, useSession} from '#/state/session'
import {app} from '#/lexicons'
import {type Notification, type UnreadCheck} from './types'
import {
  fetchUnreadCheckPage,
  markUnreadCheckSeen,
  summarizeUnreadCheck,
} from './util'

const UPDATE_INTERVAL = 30 * 1e3 // 30sec

const broadcast = new BroadcastChannel('NOTIFS_BROADCAST_CHANNEL')

type StateContext = string

type CheckUnread = (opts?: {isPoll?: boolean}) => Promise<void>

interface ApiContext {
  /**
   * Marks notifications as seen on the server, up to `seenAt`.
   */
  markAllRead: (opts: {seenAt: Date}) => Promise<void>
}

const stateContext = createContext<StateContext>('')
stateContext.displayName = 'NotificationsUnreadStateContext'

const lastCheckContext = createContext<UnreadCheck | undefined>(undefined)
lastCheckContext.displayName = 'NotificationsUnreadLastCheckContext'

const apiContext = createContext<ApiContext>({
  async markAllRead() {},
})
apiContext.displayName = 'NotificationsUnreadApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {hasSession} = useSession()
  const client = useAppviewClient()
  const moderationOpts = useModerationOpts()

  const [numUnread, setNumUnread] = useState('')
  const [lastCheck, setLastCheck] = useState<UnreadCheck>()

  const checkUnreadRef = useRef<CheckUnread | null>(null)
  /**
   * How many unread notifications the last check found, which slows polling
   * down while there are some.
   */
  const unreadCountRef = useRef(0)

  // periodic sync
  useEffect(() => {
    if (!hasSession || !checkUnreadRef.current) {
      return
    }
    checkUnreadRef.current() // fire on init
    const interval = setInterval(
      () => checkUnreadRef.current?.({isPoll: true}),
      UPDATE_INTERVAL,
    )
    return () => clearInterval(interval)
  }, [hasSession])

  // listen for broadcasts
  useEffect(() => {
    const listener = ({data}: MessageEvent) => {
      unreadCountRef.current =
        data.event === '30+'
          ? 30
          : data.event === ''
            ? 0
            : parseInt(data.event, 10) || 1
      setNumUnread(data.event)
    }
    broadcast.addEventListener('message', listener)
    return () => {
      broadcast.removeEventListener('message', listener)
    }
  }, [setNumUnread])

  const isFetchingRef = useRef(false)
  /**
   * When notifications were last marked as seen, in ms since the epoch. A
   * check asked before then may count notifications that have been seen since.
   */
  const lastMarkedReadAt = useRef(0)

  const checkUnread: CheckUnread = async ({isPoll} = {}) => {
    try {
      if (!hasSession) return
      if (AppState.currentState !== 'active') {
        return
      }

      // reduce polling if unread count is set
      if (isPoll && unreadCountRef.current !== 0) {
        // if hit 30+ then don't poll, otherwise reduce polling by 50%
        if (unreadCountRef.current >= 30 || Math.random() >= 0.5) {
          return
        }
      }

      if (isFetchingRef.current) {
        return
      }
      // Do not move this without ensuring it gets a symmetrical reset in the finally block.
      isFetchingRef.current = true

      // count
      const requestedAt = Date.now()
      const {notifications} = await fetchUnreadCheckPage({
        client,
        limit: 40,
        moderationOpts,
      })
      /*
       * Marked read while this was in flight, so the count may be stale.
       * The next check will catch up.
       */
      if (requestedAt < lastMarkedReadAt.current) {
        return
      }
      const unreadCount = countUnread(notifications)
      const unreadCountStr =
        unreadCount >= 30 ? '30+' : unreadCount === 0 ? '' : String(unreadCount)
      unreadCountRef.current = unreadCount

      // update & broadcast
      setNumUnread(unreadCountStr)
      setLastCheck(summarizeUnreadCheck(notifications, requestedAt))
      broadcast.postMessage({event: unreadCountStr})
    } finally {
      isFetchingRef.current = false
    }
  }
  checkUnreadRef.current = checkUnread

  // create API
  const api = useMemo<ApiContext>(() => {
    return {
      async markAllRead({seenAt}) {
        // update server
        await client.call(app.bsky.notification.updateSeen, {
          // toISOString always emits the Z-suffixed form the format requires
          seenAt: seenAt.toISOString() as ISODatetimeString,
        })
        lastMarkedReadAt.current = Date.now()

        // Nothing is unread any more, so polling goes back to its usual rate
        unreadCountRef.current = 0

        // update & broadcast
        setNumUnread('')
        setLastCheck(check => markUnreadCheckSeen(check, seenAt.getTime()))
        broadcast.postMessage({event: ''})
        resetBadgeCount()
      },
    }
  }, [client])

  return (
    <stateContext.Provider value={numUnread}>
      <lastCheckContext.Provider value={lastCheck}>
        <apiContext.Provider value={api}>{children}</apiContext.Provider>
      </lastCheckContext.Provider>
    </stateContext.Provider>
  )
}

export function useUnreadNotifications() {
  return useContext(stateContext)
}

/**
 * What the last unread check found, or undefined before the first one.
 * Updated on every check, and whenever notifications are marked read.
 */
export function useLastUnreadCheck() {
  return useContext(lastCheckContext)
}

export function useUnreadNotificationsApi() {
  return useContext(apiContext)
}

function countUnread(notifications: Notification[]) {
  return notifications.filter(notif => !notif.isRead).length
}

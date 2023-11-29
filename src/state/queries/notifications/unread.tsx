import React from 'react'
import * as Notifications from 'expo-notifications'
import BroadcastChannel from '#/lib/broadcast'
import {useSession, getAgent} from '#/state/session'
import {useModerationOpts} from '../preferences'
import {shouldFilterNotif} from './util'
import {isNative} from '#/platform/detection'

const UPDATE_INTERVAL = 30 * 1e3 // 30sec

const broadcast = new BroadcastChannel('NOTIFS_BROADCAST_CHANNEL')

type StateContext = string

interface ApiContext {
  markAllRead: () => Promise<void>
  checkUnread: () => Promise<void>
}

const stateContext = React.createContext<StateContext>('')

const apiContext = React.createContext<ApiContext>({
  async markAllRead() {},
  async checkUnread() {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {hasSession} = useSession()
  const moderationOpts = useModerationOpts()

  const [numUnread, setNumUnread] = React.useState('')

  const checkUnreadRef = React.useRef<(() => Promise<void>) | null>(null)
  const lastSyncRef = React.useRef<Date>(new Date())

  // periodic sync
  React.useEffect(() => {
    if (!hasSession || !checkUnreadRef.current) {
      return
    }
    checkUnreadRef.current() // fire on init
    const interval = setInterval(checkUnreadRef.current, UPDATE_INTERVAL)
    return () => clearInterval(interval)
  }, [hasSession])

  // listen for broadcasts
  React.useEffect(() => {
    const listener = ({data}: MessageEvent) => {
      lastSyncRef.current = new Date()
      setNumUnread(data.event)
    }
    broadcast.addEventListener('message', listener)
    return () => {
      broadcast.removeEventListener('message', listener)
    }
  }, [setNumUnread])

  // create API
  const api = React.useMemo<ApiContext>(() => {
    return {
      async markAllRead() {
        // update server
        await getAgent().updateSeenNotifications(
          lastSyncRef.current.toISOString(),
        )

        // update & broadcast
        setNumUnread('')
        broadcast.postMessage({event: ''})
      },

      async checkUnread() {
        if (!getAgent().session) return

        // count
        const res = await getAgent().listNotifications({limit: 40})
        const filtered = res.data.notifications.filter(
          notif => !notif.isRead && !shouldFilterNotif(notif, moderationOpts),
        )
        const num =
          filtered.length >= 30
            ? '30+'
            : filtered.length === 0
            ? ''
            : String(filtered.length)
        if (isNative) {
          Notifications.setBadgeCountAsync(Math.min(filtered.length, 30))
        }

        // track last sync
        const now = new Date()
        const lastIndexed = filtered[0] && new Date(filtered[0].indexedAt)
        lastSyncRef.current =
          !lastIndexed || now > lastIndexed ? now : lastIndexed

        // update & broadcast
        setNumUnread(num)
        broadcast.postMessage({event: num})
      },
    }
  }, [setNumUnread, moderationOpts])
  checkUnreadRef.current = api.checkUnread

  return (
    <stateContext.Provider value={numUnread}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useUnreadNotifications() {
  return React.useContext(stateContext)
}

export function useUnreadNotificationsApi() {
  return React.useContext(apiContext)
}

import React from 'react'
import BroadcastChannel from '#/lib/broadcast'

const broadcast = new BroadcastChannel('NOTIFS_BROADCAST_CHANNEL')

interface Context {
  numUnread: number
  setNumUnread: (num: number) => void
}

const context = React.createContext<Context>({
  numUnread: 0,
  setNumUnread() {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [numUnread, setNumUnread] = React.useState(0)
  const state = React.useMemo<Context>(
    () => ({
      numUnread,
      setNumUnread(num: number) {
        setNumUnread(num)
        console.log('notifs broadcasting', num)
        broadcast.postMessage({event: String(num)})
      },
    }),
    [numUnread, setNumUnread],
  )

  // listen for broadcasts
  React.useEffect(() => {
    const listener = ({data}: MessageEvent) => {
      const count = parseInt(data.event, 10)
      console.log('notifs broadcast got', count, data.event)
      if (typeof count === 'number') {
        setNumUnread(count)
      }
    }
    broadcast.addEventListener('message', listener)
    return () => {
      broadcast.removeEventListener('message', listener)
    }
  }, [setNumUnread])

  return <context.Provider value={state}>{children}</context.Provider>
}

export function useUnreadNotifications() {
  return React.useContext(context)
}

import {createContext, useContext, useImperativeHandle, useState} from 'react'
import {type NavigationContainerRefWithCurrent} from '@react-navigation/native'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {type AllNavigatorParams} from '#/lib/routes/types'

type QueueAction = () => void
const NavigationAvailableContext = createContext<
  ((cb: QueueAction) => void) | null
>(null)

export function NavigationAvailable({
  children,
  ref,
  navigationRef,
}: {
  children: React.ReactNode
  ref: React.Ref<{onReady: () => void}>
  navigationRef: NavigationContainerRefWithCurrent<AllNavigatorParams>
}) {
  const [queue, setQueue] = useState<QueueAction[]>([])

  useImperativeHandle(ref, () => ({
    onReady: () => {
      for (const item of queue) {
        item()
      }
      setQueue([])
    },
  }))

  const runWhenNavigationAvailable = useNonReactiveCallback(
    (cb: QueueAction) => {
      if (navigationRef.isReady()) {
        cb()
      } else {
        setQueue(prev => [...prev, cb])
      }
    },
  )

  return (
    <NavigationAvailableContext.Provider value={runWhenNavigationAvailable}>
      {children}
    </NavigationAvailableContext.Provider>
  )
}

export function useRunWhenNavigationAvailable() {
  const context = useContext(NavigationAvailableContext)
  if (!context) {
    throw new Error(
      'useRunWhenNavigationAvailable must be used within a NavigationAvailable component',
    )
  }
  return context
}

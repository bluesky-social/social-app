import {createContext, useContext, useEffect, useState} from 'react'

import {isWeb} from '#/platform/detection'
import {IS_DEV} from '#/env'

const LightStatusBarRefCountContext = createContext<number>(0)
const SetLightStatusBarRefCountContext = createContext<React.Dispatch<
  React.SetStateAction<number>
> | null>(null)

export function useLightStatusBarRefCount() {
  return useContext(LightStatusBarRefCountContext)
}

export function useLightStatusBar(enabled: boolean) {
  const setRefCount = useContext(SetLightStatusBarRefCountContext)
  useEffect(() => {
    // noop on web -sfn
    if (isWeb) return

    if (!setRefCount) {
      if (IS_DEV)
        console.error(
          'useLightStatusBar was used without a SetLightStatusBarRefCountContext provider',
        )
      return
    }
    if (enabled) {
      setRefCount(prev => prev + 1)
      return () => setRefCount(prev => prev - 1)
    }
  }, [enabled, setRefCount])
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [refCount, setRefCount] = useState(0)

  return (
    <SetLightStatusBarRefCountContext.Provider value={setRefCount}>
      <LightStatusBarRefCountContext.Provider value={refCount}>
        {children}
      </LightStatusBarRefCountContext.Provider>
    </SetLightStatusBarRefCountContext.Provider>
  )
}

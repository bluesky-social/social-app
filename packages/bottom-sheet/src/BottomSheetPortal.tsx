import {createContext, useContext, useMemo} from 'react'

import {createPortalGroup_INTERNAL} from './lib/Portal'

type PortalContext = React.ElementType<{children: React.ReactNode}>

export const Context = createContext({} as PortalContext)
Context.displayName = 'BottomSheetPortalContext'

export const useBottomSheetPortal_INTERNAL = () => useContext(Context)

export function BottomSheetPortalProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const portal = useMemo(() => {
    return createPortalGroup_INTERNAL()
  }, [])

  return (
    <Context.Provider value={portal.Portal}>
      <portal.Provider>
        {children}
        <portal.Outlet />
      </portal.Provider>
    </Context.Provider>
  )
}

const defaultPortal = createPortalGroup_INTERNAL()

export const BottomSheetOutlet = defaultPortal.Outlet

export function BottomSheetProvider({children}: {children: React.ReactNode}) {
  return (
    <Context.Provider value={defaultPortal.Portal}>
      <defaultPortal.Provider>{children}</defaultPortal.Provider>
    </Context.Provider>
  )
}

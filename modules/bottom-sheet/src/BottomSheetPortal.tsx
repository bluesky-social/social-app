import React from 'react'

import {createPortalGroup_INTERNAL} from './lib/Portal'

type PortalContext = React.ElementType<{children: React.ReactNode}>

export const Context = React.createContext({} as PortalContext)

export const useBottomSheetPortal_INTERNAL = () => React.useContext(Context)

export function BottomSheetPortalProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const portal = React.useMemo(() => {
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

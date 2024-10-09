import React from 'react'

import {createPortalGroup_INTERNAL} from './lib/Portal'

type PortalContext = React.ElementType<{children: React.ReactNode}>

const Context = React.createContext({} as PortalContext)

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

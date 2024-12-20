import React, {useContext, useId} from 'react'
import {createPortal} from 'react-dom'

export function createPortalGroup() {
  const Context = React.createContext<string | null>(null)

  function Provider(props: React.PropsWithChildren<{}>) {
    const id = useId()
    return <Context.Provider value={id}>{props.children}</Context.Provider>
  }

  function Outlet() {
    const id = useContext(Context)
    if (!id) throw new Error('Outlet must be used within a Portal Provider')
    return <div id={id} />
  }

  function Portal({children}: React.PropsWithChildren<{}>) {
    const id = useContext(Context)
    if (!id) throw new Error('Portal must be used within a Portal Provider')
    const elem = document.getElementById(id)
    if (!elem) {
      console.error('Portal element not found', id)
      return null
    }
    return createPortal(children, elem)
  }

  return {Provider, Outlet, Portal}
}

const DefaultPortal = createPortalGroup()
export const Provider = DefaultPortal.Provider
export const Outlet = DefaultPortal.Outlet
export const Portal = DefaultPortal.Portal

import React from 'react'

type Component = React.ReactElement

type ContextType = {
  outlet: Component | null
  append(id: string, component: Component): void
  remove(id: string): void
}

type ComponentMap = {
  [id: string]: Component
}

export function createPortalGroup_INTERNAL() {
  const Context = React.createContext<ContextType>({
    outlet: null,
    append: () => {},
    remove: () => {},
  })

  function Provider(props: React.PropsWithChildren<{}>) {
    const map = React.useRef<ComponentMap>({})
    const [outlet, setOutlet] = React.useState<ContextType['outlet']>(null)

    const append = React.useCallback<ContextType['append']>((id, component) => {
      if (map.current[id]) return
      map.current[id] = <React.Fragment key={id}>{component}</React.Fragment>
      setOutlet(<>{Object.values(map.current)}</>)
    }, [])

    const remove = React.useCallback<ContextType['remove']>(id => {
      delete map.current[id]
      setOutlet(<>{Object.values(map.current)}</>)
    }, [])

    const contextValue = React.useMemo(
      () => ({
        outlet,
        append,
        remove,
      }),
      [outlet, append, remove],
    )

    return (
      <Context.Provider value={contextValue}>{props.children}</Context.Provider>
    )
  }

  function Outlet() {
    const ctx = React.useContext(Context)
    return ctx.outlet
  }

  function Portal({children}: React.PropsWithChildren<{}>) {
    const {append, remove} = React.useContext(Context)
    const id = React.useId()
    React.useEffect(() => {
      append(id, children as Component)
      return () => remove(id)
    }, [id, children, append, remove])
    return null
  }

  return {Provider, Outlet, Portal}
}

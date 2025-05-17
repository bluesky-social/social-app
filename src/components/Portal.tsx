import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

type Component = React.ReactElement

type ContextType = {
  outlet: Component | null
  append(id: string, component: Component): void
  remove(id: string): void
}

type ComponentMap = {
  [id: string]: Component | null
}

export function createPortalGroup() {
  const Context = createContext<ContextType>({
    outlet: null,
    append: () => {},
    remove: () => {},
  })

  function Provider(props: React.PropsWithChildren<{}>) {
    const map = useRef<ComponentMap>({})
    const [outlet, setOutlet] = useState<ContextType['outlet']>(null)

    const append = useCallback<ContextType['append']>((id, component) => {
      if (map.current[id]) return
      map.current[id] = <Fragment key={id}>{component}</Fragment>
      setOutlet(<>{Object.values(map.current)}</>)
    }, [])

    const remove = useCallback<ContextType['remove']>(id => {
      map.current[id] = null
      setOutlet(<>{Object.values(map.current)}</>)
    }, [])

    const contextValue = useMemo(
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
    const ctx = useContext(Context)
    return ctx.outlet
  }

  function Portal({children}: React.PropsWithChildren<{}>) {
    const {append, remove} = useContext(Context)
    const id = useId()
    useEffect(() => {
      append(id, children as Component)
      return () => remove(id)
    }, [id, children, append, remove])
    return null
  }

  return {Provider, Outlet, Portal}
}

const DefaultPortal = createPortalGroup()
export const Provider = DefaultPortal.Provider
export const Outlet = DefaultPortal.Outlet
export const Portal = DefaultPortal.Portal

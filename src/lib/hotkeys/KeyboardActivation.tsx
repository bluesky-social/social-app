import {createContext, useContext, useEffect} from 'react'

export type KeyboardActivationRegistrar = (activate: () => void) => () => void

const Context = createContext<KeyboardActivationRegistrar | undefined>(
  undefined,
)
Context.displayName = 'KeyboardActivationContext'

export function Boundary({
  register,
  children,
}: React.PropsWithChildren<{register: KeyboardActivationRegistrar}>) {
  return <Context.Provider value={register}>{children}</Context.Provider>
}

export function Isolation({children}: React.PropsWithChildren<unknown>) {
  return <Context.Provider value={undefined}>{children}</Context.Provider>
}

export function useRegistration(activate: () => void) {
  const register = useContext(Context)

  useEffect(() => {
    return register?.(activate)
  }, [activate, register])
}

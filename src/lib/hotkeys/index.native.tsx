import {useMemo} from 'react'

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

const noop = () => {}

export function useHotkeysContext() {
  return useMemo(
    () => ({
      enableScope: noop,
      disableScope: noop,
    }),
    [],
  )
}

import {useMemo} from 'react'

export function Provider({children}: {children: React.ReactNode}) {
  return children
}

const noop = (_scope: string) => {}

export function useHotkeysContext() {
  return useMemo(
    () => ({
      enableScope: noop,
      disableScope: noop,
    }),
    [],
  )
}

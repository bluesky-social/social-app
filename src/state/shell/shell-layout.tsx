import React from 'react'
import {SharedValue, useSharedValue} from 'react-native-reanimated'

type StateContext = {
  headerHeight: SharedValue<number>
  footerHeight: SharedValue<number>
}

const stateContext = React.createContext<StateContext>({
  headerHeight: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
    get() {
      return 0
    },
    set() {},
  },
  footerHeight: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
    get() {
      return 0
    },
    set() {},
  },
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const headerHeight = useSharedValue(0)
  const footerHeight = useSharedValue(0)

  const value = React.useMemo(
    () => ({
      headerHeight,
      footerHeight,
    }),
    [headerHeight, footerHeight],
  )

  return <stateContext.Provider value={value}>{children}</stateContext.Provider>
}

export function useShellLayout() {
  return React.useContext(stateContext)
}

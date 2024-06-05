import {createContext, PropsWithChildren, useContext, useMemo} from 'react'
import {SharedValue, useSharedValue} from 'react-native-reanimated'

type StateContext = {
  headerHeight: SharedValue<number>
  footerHeight: SharedValue<number>
}

const stateContext = createContext<StateContext>({
  headerHeight: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
  },
  footerHeight: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
  },
})

export function Provider({children}: PropsWithChildren<{}>) {
  const headerHeight = useSharedValue(0)
  const footerHeight = useSharedValue(0)

  const value = useMemo(
    () => ({
      headerHeight,
      footerHeight,
    }),
    [headerHeight, footerHeight],
  )

  return <stateContext.Provider value={value}>{children}</stateContext.Provider>
}

export function useShellLayout() {
  return useContext(stateContext)
}

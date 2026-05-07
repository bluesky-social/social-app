import {createContext, useContext, useMemo} from 'react'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'

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
stateContext.displayName = 'ShellLayoutContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
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

import {createContext, useCallback, useContext, useMemo} from 'react'
import {
  type SharedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

type StateContext = {
  headerMode: SharedValue<number>
  footerMode: SharedValue<number>
}
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>({
  headerMode: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
    get() {
      return 0
    },
    set() {},
  },
  footerMode: {
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
stateContext.displayName = 'MinimalModeStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'MinimalModeSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const headerMode = useSharedValue(0)
  const footerMode = useSharedValue(0)
  const setMode = useCallback(
    (v: boolean) => {
      'worklet'
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      )
      footerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      )
    },
    [headerMode, footerMode],
  )
  const value = useMemo(
    () => ({
      headerMode,
      footerMode,
    }),
    [headerMode, footerMode],
  )
  return (
    <stateContext.Provider value={value}>
      <setContext.Provider value={setMode}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useMinimalShellMode() {
  return useContext(stateContext)
}

export function useSetMinimalShellMode() {
  return useContext(setContext)
}

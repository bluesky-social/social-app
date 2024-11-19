import React from 'react'
import {
  cancelAnimation,
  SharedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

type StateContext = {
  headerMode: SharedValue<number>
  footerMode: SharedValue<number>
}
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>({
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
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const headerMode = useSharedValue(0)
  const footerMode = useSharedValue(0)
  const setMode = React.useCallback(
    (v: boolean) => {
      'worklet'
      // Cancel any existing animation
      cancelAnimation(headerMode)
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      )
      cancelAnimation(footerMode)
      footerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      )
    },
    [headerMode, footerMode],
  )
  const value = React.useMemo(
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
  return React.useContext(stateContext)
}

export function useSetMinimalShellMode() {
  return React.useContext(setContext)
}

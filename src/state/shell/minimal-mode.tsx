import React from 'react'
import {
  Easing,
  SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

type StateContext = SharedValue<number>
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>({
  value: 0,
  addListener() {},
  removeListener() {},
  modify() {},
})
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const mode = useSharedValue(0)
  const setMode = React.useCallback(
    (v: boolean) => {
      'worklet'
      mode.value = withTiming(v ? 1 : 0, {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    },
    [mode],
  )
  return (
    <stateContext.Provider value={mode}>
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

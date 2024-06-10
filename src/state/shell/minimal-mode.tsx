import React from 'react'
import {
  cancelAnimation,
  SharedValue,
  useSharedValue,
  withSpring,
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
      // Cancel any existing animation
      cancelAnimation(mode)
      mode.value = withSpring(v ? 1 : 0, {
        overshootClamping: true,
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

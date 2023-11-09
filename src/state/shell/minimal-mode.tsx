import React from 'react'
import {useSharedValue, SharedValue} from 'react-native-reanimated'

type StateContext = SharedValue<number>
type SetContext = (v: number) => void

const stateContext = React.createContext<StateContext>({
  value: 0,
  addListener() {},
  removeListener() {},
  modify() {},
})
const setContext = React.createContext<SetContext>((_: number) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const mode = useSharedValue(0)
  const setMode = React.useCallback(
    (v: number) => {
      mode.value = v
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

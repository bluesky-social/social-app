import React from 'react'
import {useSharedValue, SharedValue} from 'react-native-reanimated'

type StateContext = SharedValue<boolean>
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>({
  value: false,
  addListener() {},
  removeListener() {},
  modify() {},
})
const setContext = React.createContext<SetContext>((_: boolean) => {})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const mode = useSharedValue(false)
  const setMode = React.useCallback(
    (v: boolean) => {
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

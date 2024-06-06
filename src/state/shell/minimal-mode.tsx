import {createContext, PropsWithChildren, useCallback, useContext} from 'react'
import {
  Easing,
  SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

type StateContext = SharedValue<number>
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>({
  value: 0,
  addListener() {},
  removeListener() {},
  modify() {},
})
const setContext = createContext<SetContext>((_: boolean) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const mode = useSharedValue(0)
  const setMode = useCallback(
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
  return useContext(stateContext)
}

export function useSetMinimalShellMode() {
  return useContext(setContext)
}

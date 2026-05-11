import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  type SharedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'

type StateContext = {
  headerMode: SharedValue<number>
  footerMode: SharedValue<number>
}
type SetContext = {
  add: () => void
  subtract: () => void
}

const stateContext = createContext<StateContext | null>(null)
stateContext.displayName = 'MinimalModeStateContext'
const setContext = createContext<SetContext | null>(null)
setContext.displayName = 'MinimalModeSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const headerMode = useSharedValue(0)
  const footerMode = useSharedValue(0)

  const setModeWorklet = useCallback(
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

  // defaults to "visible", if the count is >0 it gets hidden
  const countRef = useRef(0)
  const add = useCallback(() => {
    // 0 -> 1 = hide
    if (countRef.current === 0) setModeWorklet(true)

    countRef.current += 1
  }, [setModeWorklet])
  const subtract = useCallback(() => {
    // 1 -> 0 = show
    if (countRef.current === 1) setModeWorklet(false)

    // count must never go below 0
    if (countRef.current > 0) countRef.current -= 1
  }, [setModeWorklet])

  const setters = useMemo(
    () => ({
      add,
      subtract,
    }),
    [add, subtract],
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
      <setContext.Provider value={setters}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useMinimalShellMode() {
  const context = useContext(stateContext)
  if (!context)
    throw new Error(
      'useMinimalShellMode must be used within a MinimalModeProvider',
    )
  return context
}

export function useMinimalShellModeSetters() {
  const context = useContext(setContext)
  if (!context)
    throw new Error(
      'useMinimalShellModeSetters must be used within a MinimalModeProvider',
    )
  return context
}

export function useEnableMinimalShellMode({enabled} = {enabled: true}) {
  const setters = useMinimalShellModeSetters()
  useEffect(() => {
    if (enabled) {
      setters.add()
      return () => setters.subtract()
    }
  }, [enabled, setters])
}

export function useEnableMinimalShellModeForScreen(
  {enabled} = {enabled: true},
) {
  const setters = useMinimalShellModeSetters()
  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        setters.add()
        return () => setters.subtract()
      }
    }, [enabled, setters]),
  )
}

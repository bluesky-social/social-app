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
  // Set to 1 to hide the footer entirely for a screen (e.g. video feed). Driven
  // by the add/subtract counters below.
  footerMode: SharedValue<number>
  // Set between 0 and 1 to hide the footer in response to scrolling, mirroring
  // the home header. Driven by MainScrollProvider, and reset to 0 when the
  // scrolling feed loses focus so other tabs never inherit a hidden bar.
  footerScrollMode: SharedValue<number>
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
  const footerMode = useSharedValue(0)
  const footerScrollMode = useSharedValue(0)

  const setModeWorklet = useCallback(
    (v: boolean) => {
      'worklet'
      footerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        }),
      )
    },
    [footerMode],
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
      footerMode,
      footerScrollMode,
    }),
    [footerMode, footerScrollMode],
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

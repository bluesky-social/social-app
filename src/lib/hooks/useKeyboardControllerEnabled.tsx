import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {useKeyboardController} from 'react-native-keyboard-controller'
import {useFocusEffect} from '@react-navigation/native'

const KeyboardControllerRefCountContext = createContext<{
  incrementRefCount: () => void
  decrementRefCount: () => void
}>({
  incrementRefCount: () => {},
  decrementRefCount: () => {},
})

export function KeyboardControllerEnabledProvider({
  children,
}: React.PropsWithChildren<{}>) {
  const [refCount, setRef] = useState(0)
  const {enabled, setEnabled} = useKeyboardController()

  const shouldBeEnabled = refCount > 0
  if (enabled !== shouldBeEnabled) {
    setEnabled(shouldBeEnabled)
  }

  const value = useMemo(
    () => ({
      incrementRefCount: () => setRef(count => count + 1),
      decrementRefCount: () => setRef(count => Math.max(count - 1, 0)),
    }),
    [],
  )

  return (
    <KeyboardControllerRefCountContext.Provider value={value}>
      {children}
    </KeyboardControllerRefCountContext.Provider>
  )
}

export function useEnableKeyboardController(shouldEnable: boolean) {
  const {incrementRefCount, decrementRefCount} = useContext(
    KeyboardControllerRefCountContext,
  )

  useEffect(() => {
    if (!shouldEnable) return
    incrementRefCount()
    return () => {
      decrementRefCount()
    }
  }, [shouldEnable, incrementRefCount, decrementRefCount])
}

/**
 * Like `useEnableKeyboardController`, but using `useFocusEffect`
 */
export function useEnableKeyboardControllerScreen(shouldEnable = true) {
  const {incrementRefCount, decrementRefCount} = useContext(
    KeyboardControllerRefCountContext,
  )

  useFocusEffect(
    useCallback(() => {
      if (!shouldEnable) return
      incrementRefCount()
      return () => {
        decrementRefCount()
      }
    }, [shouldEnable, incrementRefCount, decrementRefCount]),
  )
}

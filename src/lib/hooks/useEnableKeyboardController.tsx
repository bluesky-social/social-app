import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  KeyboardProvider,
  useKeyboardController,
} from 'react-native-keyboard-controller'
import {useFocusEffect} from '@react-navigation/native'

const KeyboardControllerRefCountContext = createContext<{
  incrementRefCount: () => void
  decrementRefCount: () => void
}>({
  incrementRefCount: () => {},
  decrementRefCount: () => {},
})

export function KeyboardControllerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <KeyboardProvider
      enabled={false}
      // I don't think this is necessary, but Chesterton's fence and all that -sfn
      statusBarTranslucent={true}>
      <KeyboardControllerProviderInner>
        {children}
      </KeyboardControllerProviderInner>
    </KeyboardProvider>
  )
}

function KeyboardControllerProviderInner({
  children,
}: {
  children: React.ReactNode
}) {
  const {setEnabled} = useKeyboardController()
  const refCount = useRef(0)

  const value = useMemo(
    () => ({
      incrementRefCount: () => {
        refCount.current++
        setEnabled(refCount.current > 0)
      },
      decrementRefCount: () => {
        refCount.current--
        setEnabled(refCount.current > 0)

        if (__DEV__ && refCount.current < 0) {
          console.error('KeyboardController ref count < 0')
        }
      },
    }),
    [setEnabled],
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
    if (!shouldEnable) {
      return
    }
    incrementRefCount()
    return () => {
      decrementRefCount()
    }
  }, [shouldEnable, incrementRefCount, decrementRefCount])
}

/**
 * Like `useEnableKeyboardController`, but using `useFocusEffect`
 */
export function useEnableKeyboardControllerScreen(shouldEnable: boolean) {
  const {incrementRefCount, decrementRefCount} = useContext(
    KeyboardControllerRefCountContext,
  )

  useFocusEffect(
    useCallback(() => {
      if (!shouldEnable) {
        return
      }
      incrementRefCount()
      return () => {
        decrementRefCount()
      }
    }, [shouldEnable, incrementRefCount, decrementRefCount]),
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {Gesture, type NativeGesture} from 'react-native-gesture-handler'

/*
 * Lets descendant components register a Gesture.Native() that the shell
 * drawer's pan handler must wait to fail before it can activate. Used to
 * prevent the drawer from intercepting horizontal swipes inside surfaces
 * like the image carousel where the child-side blocksExternalGesture pattern
 * is unreliable on Android. See APP-2119.
 *
 * Two contexts so consumers re-render only when they need to:
 * - RegisterContext is referentially stable, only used by the inner hook
 *   that registers a single gesture. Galleries don't re-render when their
 *   peers mount/unmount.
 * - GesturesContext is reactive; only DrawerLayout reads it.
 */

type Register = (gesture: NativeGesture) => () => void

const RegisterContext = createContext<Register | null>(null)
const GesturesContext = createContext<readonly NativeGesture[]>([])

export function DrawerWaitGestureProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [gestures, setGestures] = useState<readonly NativeGesture[]>([])

  const register = useCallback<Register>(gesture => {
    setGestures(prev => [...prev, gesture])
    return () => {
      setGestures(prev => prev.filter(g => g !== gesture))
    }
  }, [])

  return (
    <RegisterContext.Provider value={register}>
      <GesturesContext.Provider value={gestures}>
        {children}
      </GesturesContext.Provider>
    </RegisterContext.Provider>
  )
}

export function useDrawerWaitGestures(): readonly NativeGesture[] {
  return useContext(GesturesContext)
}

export function useRegisterDrawerWaitGesture(): NativeGesture {
  const register = useContext(RegisterContext)
  const [gesture] = useState(() => Gesture.Native())

  useEffect(() => {
    if (!register) return
    return register(gesture)
  }, [register, gesture])

  return gesture
}

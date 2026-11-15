import {createContext, useCallback, useContext, useMemo} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'

type StateContext = {
  headerHeight: SharedValue<number>
  footerHeight: SharedValue<number>
}

const stateContext = createContext<StateContext>({
  headerHeight: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
    get() {
      return 0
    },
    set() {},
  },
  footerHeight: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
    get() {
      return 0
    },
    set() {},
  },
})
stateContext.displayName = 'ShellLayoutContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const headerHeight = useSharedValue(0)
  const footerHeight = useSharedValue(0)

  const value = useMemo(
    () => ({
      headerHeight,
      footerHeight,
    }),
    [headerHeight, footerHeight],
  )

  return <stateContext.Provider value={value}>{children}</stateContext.Provider>
}

export function useShellLayout() {
  return useContext(stateContext)
}

/**
 * Reports a screen header's height to the shell, for the scroll handling that
 * hides it. Every screen with a header shares the shell's value, so it's
 * handed back each time the screen is focused, in case another screen's
 * header has replaced it meanwhile.
 *
 * Also returns the header's own height, which other screens can't change.
 */
export function useShellHeaderLayout() {
  const {headerHeight} = useShellLayout()
  const ownHeight = useSharedValue(0)

  useFocusEffect(
    useCallback(() => {
      const height = ownHeight.get()
      if (height > 0) {
        headerHeight.set(height)
      }
    }, [headerHeight, ownHeight]),
  )

  const onLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    ownHeight.set(height)
    headerHeight.set(height)
  }

  return {height: ownHeight, onLayout}
}

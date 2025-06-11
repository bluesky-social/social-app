import {createContext, useCallback, useContext, useState} from 'react'
import {useFocusEffect} from '@react-navigation/native'

type HideBottomBarBorderSetter = () => () => void

const HideBottomBarBorderContext = createContext<boolean>(false)
const HideBottomBarBorderSetterContext =
  createContext<HideBottomBarBorderSetter | null>(null)

export function useHideBottomBarBorderSetter() {
  const hideBottomBarBorder = useContext(HideBottomBarBorderSetterContext)
  if (!hideBottomBarBorder) {
    throw new Error(
      'useHideBottomBarBorderSetter must be used within a HideBottomBarBorderProvider',
    )
  }
  return hideBottomBarBorder
}

export function useHideBottomBarBorderForScreen() {
  const hideBorder = useHideBottomBarBorderSetter()

  useFocusEffect(
    useCallback(() => {
      const cleanup = hideBorder()
      return () => cleanup()
    }, [hideBorder]),
  )
}

export function useHideBottomBarBorder() {
  return useContext(HideBottomBarBorderContext)
}

export function Provider({children}: {children: React.ReactNode}) {
  const [refCount, setRefCount] = useState(0)

  const setter = useCallback(() => {
    setRefCount(prev => prev + 1)
    return () => setRefCount(prev => prev - 1)
  }, [])

  return (
    <HideBottomBarBorderSetterContext.Provider value={setter}>
      <HideBottomBarBorderContext.Provider value={refCount > 0}>
        {children}
      </HideBottomBarBorderContext.Provider>
    </HideBottomBarBorderSetterContext.Provider>
  )
}

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'

import {atoms as a} from '#/alf'

export type PagerScrollState = 'idle' | 'dragging' | 'settling'

export type PagerRenderProps = {
  selectedPage: number
  selectPage: (page: number) => void
  dragProgress: SharedValue<number>
  dragState: SharedValue<PagerScrollState>
}

type PagerContextValue = PagerRenderProps & {
  initialPage: number
  onPageSelected: (page: number) => void
  onPageScrollStateChanged: (state: PagerScrollState) => void
}

const PagerContext = createContext<PagerContextValue | null>(null)

export function Root({
  children,
  initialPage = 0,
  onPageSelected,
  onTabPressed,
  onPageScrollStateChanged,
  style,
  testID,
}: {
  children: ReactNode
  initialPage?: number
  onPageSelected?: (page: number) => void
  onTabPressed?: (page: number) => void
  onPageScrollStateChanged?: (state: PagerScrollState) => void
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const [selectedPage, setSelectedPage] = useState(initialPage)
  const selectedPageRef = useRef(initialPage)
  const dragProgress = useSharedValue(initialPage)
  const dragState = useSharedValue<PagerScrollState>('idle')

  const handlePageSelected = useCallback(
    (page: number) => {
      if (page !== selectedPageRef.current) {
        selectedPageRef.current = page
        setSelectedPage(page)
      }
      onPageSelected?.(page)
    },
    [onPageSelected],
  )

  const selectPage = useCallback(
    (page: number) => {
      onTabPressed?.(page)
      if (page !== selectedPageRef.current) {
        selectedPageRef.current = page
        setSelectedPage(page)
      }
    },
    [onTabPressed],
  )

  const value = useMemo(
    () => ({
      initialPage,
      selectedPage,
      selectPage,
      dragProgress,
      dragState,
      onPageSelected: handlePageSelected,
      onPageScrollStateChanged: (state: PagerScrollState) =>
        onPageScrollStateChanged?.(state),
    }),
    [
      initialPage,
      selectedPage,
      selectPage,
      dragProgress,
      dragState,
      handlePageSelected,
      onPageScrollStateChanged,
    ],
  )

  return (
    <PagerContext.Provider value={value}>
      <View testID={testID} style={[a.flex_1, style]}>
        {children}
      </View>
    </PagerContext.Provider>
  )
}

export function TabBar({
  children,
}: {
  children: (props: PagerRenderProps) => ReactNode
}) {
  return children(usePager())
}

export function usePager(): PagerRenderProps {
  const {selectedPage, selectPage, dragProgress, dragState} = usePagerContext()
  return {selectedPage, selectPage, dragProgress, dragState}
}

export function usePagerContext() {
  const context = useContext(PagerContext)
  if (!context) {
    throw new Error('Pager components must be rendered within Pager.Root')
  }
  return context
}

import React, {forwardRef} from 'react'
import {View} from 'react-native'
import PagerView, {
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEvent,
  PagerViewOnPageSelectedEventData,
  PageScrollStateChangedNativeEventData,
} from 'react-native-pager-view'
import Animated, {
  runOnJS,
  useEvent,
  useHandler,
  useSharedValue,
} from 'react-native-reanimated'

import {atoms as a, native} from '#/alf'

export type PageSelectedEvent = PagerViewOnPageSelectedEvent

export interface PagerRef {
  setPage: (index: number) => void
}

export interface RenderTabBarFnProps {
  selectedPage: number
  onSelect?: (index: number) => void
  tabBarAnchor?: JSX.Element | null | undefined // Ignored on native.
}
export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element

interface Props {
  initialPage?: number
  renderTabBar: RenderTabBarFn
  onPageSelected?: (index: number) => void
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void
  testID?: string
}

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)

export const Pager = forwardRef<PagerRef, React.PropsWithChildren<Props>>(
  function PagerImpl(
    {
      children,
      initialPage = 0,
      renderTabBar,
      onPageScrollStateChanged: parentOnPageScrollStateChanged,
      onPageSelected: parentOnPageSelected,
      testID,
    }: React.PropsWithChildren<Props>,
    ref,
  ) {
    const [selectedPage, setSelectedPage] = React.useState(0)
    const pagerView = React.useRef<PagerView>(null)

    React.useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        pagerView.current?.setPage(index)
      },
    }))

    const onPageSelectedJSThread = React.useCallback(
      (nextPosition: number) => {
        setSelectedPage(nextPosition)
        parentOnPageSelected?.(nextPosition)
      },
      [setSelectedPage, parentOnPageSelected],
    )

    const onTabBarSelect = React.useCallback(
      (index: number) => {
        pagerView.current?.setPage(index)
      },
      [pagerView],
    )

    const pendingPage = useSharedValue(selectedPage)
    const dragPage = useSharedValue(selectedPage)
    const dragProgress = useSharedValue(0)
    const dragState = useSharedValue<'idle' | 'settling' | 'dragging'>('idle')
    const handlePageScroll = usePagerHandlers(
      // These events don't fire exactly the same way on Android and iOS.
      // In these handlers we normalize the behavior to have consistent output values.
      {
        onPageScroll(e: PagerViewOnPageScrollEventData) {
          'worklet'
          let {position, offset} = e
          if (offset !== 0) {
            const offsetFromPage = offset + (position - dragPage.value)
            dragProgress.set(offsetFromPage)
          }
        },
        onPageScrollStateChanged(e: PageScrollStateChangedNativeEventData) {
          'worklet'
          dragState.set(e.pageScrollState)
          parentOnPageScrollStateChanged?.(e.pageScrollState)
          if (e.pageScrollState === 'idle') {
            const page = pendingPage.get()
            dragPage.set(page)
            dragProgress.set(0)
            runOnJS(onPageSelectedJSThread)(page)
          }
        },
        onPageSelected(e: PagerViewOnPageSelectedEventData) {
          'worklet'
          pendingPage.set(e.position)
          if (dragState.value === 'idle') {
            const page = e.position
            dragPage.set(page)
            dragProgress.set(0)
            runOnJS(onPageSelectedJSThread)(e.position)
          }
        },
      },
      [parentOnPageScrollStateChanged],
    )

    return (
      <View testID={testID} style={[a.flex_1, native(a.overflow_hidden)]}>
        {renderTabBar({
          selectedPage,
          onSelect: onTabBarSelect,
          dragGesture: {
            dragPage,
            dragProgress,
            dragState,
          },
        })}
        <AnimatedPagerView
          ref={pagerView}
          style={[a.flex_1]}
          initialPage={initialPage}
          onPageScroll={handlePageScroll}>
          {children}
        </AnimatedPagerView>
      </View>
    )
  },
)

function usePagerHandlers(
  handlers: {
    onPageScroll: (e: PagerViewOnPageScrollEventData) => void
    onPageScrollStateChanged: (e: PageScrollStateChangedNativeEventData) => void
    onPageSelected: (e: PagerViewOnPageSelectedEventData) => void
  },
  dependencies: unknown[],
) {
  const {doDependenciesDiffer} = useHandler(handlers as any, dependencies)
  const subscribeForEvents = [
    'onPageScroll',
    'onPageScrollStateChanged',
    'onPageSelected',
  ]
  return useEvent(
    event => {
      'worklet'
      const {onPageScroll, onPageScrollStateChanged, onPageSelected} = handlers
      if (event.eventName.endsWith('onPageScroll')) {
        onPageScroll(event as any as PagerViewOnPageScrollEventData)
      } else if (event.eventName.endsWith('onPageScrollStateChanged')) {
        onPageScrollStateChanged(
          event as any as PageScrollStateChangedNativeEventData,
        )
      } else if (event.eventName.endsWith('onPageSelected')) {
        onPageSelected(event as any as PagerViewOnPageSelectedEventData)
      }
    },
    subscribeForEvents,
    doDependenciesDiffer,
  )
}

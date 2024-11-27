import React, {forwardRef} from 'react'
import {View} from 'react-native'
import PagerView, {
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEvent,
  PageScrollStateChangedNativeEventData,
} from 'react-native-pager-view'
import Animated, {
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
      onPageSelected,
      testID,
    }: React.PropsWithChildren<Props>,
    ref,
  ) {
    const [selectedPage, setSelectedPage] = React.useState(0)
    const pagerView = React.useRef<PagerView>(null)
    const dragProgress = useSharedValue(selectedPage)

    React.useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        pagerView.current?.setPage(index)
      },
    }))

    const onPageSelectedInner = React.useCallback(
      (e: PageSelectedEvent) => {
        setSelectedPage(e.nativeEvent.position)
        onPageSelected?.(e.nativeEvent.position)
      },
      [setSelectedPage, onPageSelected],
    )

    const onTabBarSelect = React.useCallback(
      (index: number) => {
        pagerView.current?.setPage(index)
      },
      [pagerView],
    )

    const handlePageScroll = usePagerHandlers(
      {
        onPageScroll(e: PagerViewOnPageScrollEventData) {
          'worklet'
          const progress = e.offset + e.position
          dragProgress.value = progress
        },
        onPageScrollStateChanged(e: PageScrollStateChangedNativeEventData) {
          'worklet'
          parentOnPageScrollStateChanged?.(e.pageScrollState)
        },
      },
      [parentOnPageScrollStateChanged],
    )

    return (
      <View testID={testID} style={[a.flex_1, native(a.overflow_hidden)]}>
        {renderTabBar({
          selectedPage,
          onSelect: onTabBarSelect,
        })}
        <AnimatedPagerView
          ref={pagerView}
          style={[a.flex_1]}
          initialPage={initialPage}
          onPageSelected={onPageSelectedInner}
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
  },
  dependencies: unknown[],
) {
  const {doDependenciesDiffer} = useHandler(handlers as any, dependencies)
  const subscribeForEvents = ['onPageScroll', 'onPageScrollStateChanged']
  return useEvent(
    event => {
      'worklet'
      const {onPageScroll, onPageScrollStateChanged} = handlers
      if (event.eventName.endsWith('onPageScroll')) {
        onPageScroll(event as any as PagerViewOnPageScrollEventData)
      } else if (event.eventName.endsWith('onPageScrollStateChanged')) {
        onPageScrollStateChanged(
          event as any as PageScrollStateChangedNativeEventData,
        )
      }
    },
    subscribeForEvents,
    doDependenciesDiffer,
  )
}

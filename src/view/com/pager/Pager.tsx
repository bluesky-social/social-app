import React, {forwardRef} from 'react'
import {View} from 'react-native'
import PagerView, {
  PagerViewOnPageSelectedEvent,
  PageScrollStateChangedNativeEvent,
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
      onPageScrollStateChanged,
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

    const handlePageScrollStateChanged = React.useCallback(
      (e: PageScrollStateChangedNativeEvent) => {
        onPageScrollStateChanged?.(e.nativeEvent.pageScrollState)
      },
      [onPageScrollStateChanged],
    )

    const onTabBarSelect = React.useCallback(
      (index: number) => {
        pagerView.current?.setPage(index)
      },
      [pagerView],
    )

    const handlePageScroll = usePageScrollHandler(
      {
        onPageScroll(e: any) {
          'worklet'
          const progress = e.offset + e.position
          dragProgress.value = progress
        },
      },
      [],
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
          onPageScrollStateChanged={handlePageScrollStateChanged}
          onPageSelected={onPageSelectedInner}
          onPageScroll={handlePageScroll}>
          {children}
        </AnimatedPagerView>
      </View>
    )
  },
)

function usePageScrollHandler(handlers: any, dependencies: any): any {
  const {context, doDependenciesDiffer} = useHandler(handlers, dependencies)
  const subscribeForEvents = ['onPageScroll']
  const {onPageScroll} = handlers
  return useEvent(
    event => {
      'worklet'
      if (event.eventName.endsWith('onPageScroll')) {
        onPageScroll?.(event, context)
      }
    },
    subscribeForEvents,
    doDependenciesDiffer,
  )
}

import React, {forwardRef} from 'react'
import {View} from 'react-native'
import PagerView, {
  PagerViewOnPageSelectedEvent,
  PageScrollStateChangedNativeEvent,
} from 'react-native-pager-view'

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

    return (
      <View testID={testID} style={[a.flex_1, native(a.overflow_hidden)]}>
        {renderTabBar({
          selectedPage,
          onSelect: onTabBarSelect,
        })}
        <PagerView
          ref={pagerView}
          style={[a.flex_1]}
          initialPage={initialPage}
          onPageScrollStateChanged={handlePageScrollStateChanged}
          onPageSelected={onPageSelectedInner}>
          {children}
        </PagerView>
      </View>
    )
  },
)

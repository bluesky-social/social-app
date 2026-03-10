import {useCallback, useEffect, useRef, useState} from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type ScrollViewProps,
  View,
} from 'react-native'
import Animated, {
  interpolate,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated'

import {DraggableScrollView} from '#/view/com/pager/DraggableScrollView'
import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, useTheme, web} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

const CONTAINER_PADDING = 16
const CONTENT_PADDING = 8
// How much of the previous/next item we're requiring
// when deciding whether to scroll into view on tap.
const OFFSCREEN_ITEM_WIDTH = 20

export interface Section {
  key: string
  title: string
  component: React.JSX.Element
  hasNewBadge?: boolean
}

export type RenderNavigationFn = (props: NavigationProps) => React.JSX.Element

type SectionProps = {
  testID?: string
  ref: React.RefObject<ScrollView | null>
  sections: Section[]
  renderNavigation: RenderNavigationFn
  selectedPage: number
  setCurrentIndex: (index: number) => void
} & ScrollViewProps

export function Sections({
  testID,
  ref,
  sections,
  renderNavigation,
  selectedPage,
  setCurrentIndex,
  ...props
}: SectionProps) {
  const containerWidth = useSharedValue(0)

  const [layoutWidth, setContainerWidth] = useState(0)

  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  const snapToClosestState = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const contentOffsetX = e.contentOffset.x
      const index = Math.round(contentOffsetX / containerWidth.get())
      runOnJS(setCurrentIndex)(index)
    },
    [containerWidth, setCurrentIndex],
  )

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      'worklet'
      snapToClosestState(e.nativeEvent)
    },
    [snapToClosestState],
  )

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      timeoutId.current = setTimeout(() => {
        const contentOffsetX = e.nativeEvent.contentOffset.x
        const index = Math.round(contentOffsetX / containerWidth.get())
        setCurrentIndex(index)
      }, 200)
    },
    [containerWidth, setCurrentIndex],
  )

  useAnimatedReaction(
    () => containerWidth.get(),
    latestValue => {
      runOnJS(setContainerWidth)(latestValue)
    },
    [containerWidth],
  )

  useEffect(() => {
    const id = timeoutId.current
    return () => {
      if (id) {
        clearTimeout(id)
      }
    }
  }, [])

  return (
    <>
      {renderNavigation({
        testID,
        sections,
        selectedPage,
        tabsElRef: ref,
      })}
      <Layout.Center testID={testID}>
        <BlockDrawerGesture>
          <ScrollView
            {...props}
            ref={ref}
            horizontal
            pagingEnabled
            snapToInterval={layoutWidth}
            decelerationRate="fast"
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            onLayout={e => {
              containerWidth.set(e.nativeEvent.layout.width)
            }}
            onMomentumScrollEnd={onMomentumScrollEnd}
            onScroll={IS_WEB ? onScroll : undefined}>
            {sections?.map(({key, component}) => (
              <View key={key} style={[a.flex_1, {width: layoutWidth}]}>
                {component}
              </View>
            ))}
          </ScrollView>
        </BlockDrawerGesture>
      </Layout.Center>
    </>
  )
}

type NavigationProps = {
  testID?: string
  sections: Section[]
  selectedPage: number
  onPressSelected?: (index: number) => void
  onSelect?: (index: number) => void
  tabsElRef: React.RefObject<ScrollView | null>
}

export function Navigation({
  testID,
  sections,
  selectedPage,
  onPressSelected,
  onSelect,
  tabsElRef,
}: NavigationProps) {
  const t = useTheme()
  const scrollElRef = useAnimatedRef<ScrollView>()
  const containerSize = useSharedValue(0)
  const contentSize = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const syncScrollState = useSharedValue<'synced' | 'unsynced' | 'needs-sync'>(
    'synced',
  )
  const layouts = useSharedValue<{x: number; width: number}[]>([])

  const [containerWidth, setContainerWidth] = useState(0)

  const itemsLength = sections.length

  useAnimatedReaction(
    () => containerSize.get(),
    latestValue => {
      runOnJS(setContainerWidth)(latestValue)
    },
    [containerWidth],
  )

  const onItemLayout = useCallback(
    (i: number, layout: {x: number; width: number}) => {
      'worklet'
      layouts.modify(ls => {
        ls[i] = layout
        return ls
      })
    },
    [layouts],
  )

  const handleLayout = useCallback(
    (index: number) => (e: LayoutChangeEvent) => {
      runOnUI(onItemLayout)(index, e.nativeEvent.layout)
    },
    [onItemLayout],
  )

  const indexToOffset = useCallback(
    (index: number) => {
      'worklet'
      const layout = layouts.get()[index]
      const availableSize = containerSize.get() - 2 * CONTENT_PADDING
      if (!layout) {
        // Should not happen, but fall back to equal sizes.
        const offsetPerPage = contentSize.get() - availableSize
        return (index / (itemsLength - 1)) * offsetPerPage
      }
      const freeSpace = availableSize - layout.width
      const accumulatingOffset = interpolate(
        index,
        // Gradually shift every next item to the left so that the first item
        // is positioned like "left: 0" but the last item is like "right: 0".
        [CONTAINER_PADDING, itemsLength - 1],
        [CONTAINER_PADDING, freeSpace],
        'clamp',
      )
      return layout.x - accumulatingOffset
    },
    [itemsLength, contentSize, containerSize, layouts],
  )

  const progressToOffset = useCallback(
    (progress: number) => {
      'worklet'
      return interpolate(
        progress,
        [Math.floor(progress), Math.ceil(progress)],
        [
          indexToOffset(Math.floor(progress)),
          indexToOffset(Math.ceil(progress)),
        ],
        'clamp',
      )
    },
    [indexToOffset],
  )

  // When you press on the item, we'll scroll into view -- unless you previously
  // have scrolled the tabbar manually, in which case it'll re-sync on next press.
  const onPressUIThread = useCallback(
    (index: number) => {
      'worklet'
      const itemLayout = layouts.get()[index]
      if (!itemLayout) {
        // Should not happen.
        return
      }
      const leftEdge = itemLayout.x - OFFSCREEN_ITEM_WIDTH
      const rightEdge = itemLayout.x + itemLayout.width + OFFSCREEN_ITEM_WIDTH
      const scrollLeft = scrollX.get()
      const scrollRight = scrollLeft + containerSize.get()
      const scrollIntoView = leftEdge < scrollLeft || rightEdge > scrollRight
      if (
        syncScrollState.get() === 'synced' ||
        syncScrollState.get() === 'needs-sync' ||
        scrollIntoView
      ) {
        const offset = progressToOffset(index)
        scrollTo(scrollElRef, offset, 0, true)
      } else {
        // The item is already in view so it's disruptive to
        // scroll right now. Do it on the next opportunity.
        syncScrollState.set('needs-sync')
      }
    },
    [
      syncScrollState,
      scrollElRef,
      scrollX,
      progressToOffset,
      containerSize,
      layouts,
    ],
  )

  const onPressItem = useCallback(
    (index: number) => {
      runOnUI(onPressUIThread)(index)
      tabsElRef.current?.scrollTo({
        x: index * containerWidth,
        animated: true,
      })
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.(index)
      }
    },
    [
      onPressUIThread,
      tabsElRef,
      containerWidth,
      onSelect,
      selectedPage,
      onPressSelected,
    ],
  )

  return (
    <Layout.Center
      testID={testID}
      accessibilityRole="tablist"
      style={[a.z_10, web([a.sticky, a.top_0]), t.atoms.bg]}>
      <BlockDrawerGesture>
        <DraggableScrollView
          ref={scrollElRef}
          testID={`${testID}-selector`}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          onLayout={e => {
            containerSize.set(e.nativeEvent.layout.width)
          }}
          onScroll={e => {
            scrollX.set(Math.round(e.nativeEvent.contentOffset.x))
          }}
          onScrollBeginDrag={() => {
            // Remember that you've manually messed with the tabbar scroll.
            // This will disable auto-adjustment until after next pager swipe or item tap.
            syncScrollState.set('unsynced')
          }}>
          <Animated.View
            style={[
              a.flex_row,
              a.flex_grow,
              a.gap_sm,
              a.align_center,
              a.justify_start,
              a.px_lg,
              a.py_sm,
            ]}
            onLayout={e => {
              contentSize.set(e.nativeEvent.layout.width)
            }}>
            {sections.map(({key, hasNewBadge, title}, index) => (
              <Pressable
                key={key}
                testID={`${testID}-selector-${key}`}
                accessibilityRole="tab"
                style={[
                  a.align_center,
                  a.border,
                  a.justify_center,
                  a.rounded_lg,
                  a.px_lg,
                  {
                    paddingVertical: 6,
                  },
                  selectedPage === index
                    ? a.border_transparent
                    : t.atoms.border_contrast_low,
                  selectedPage === index ? t.atoms.bg_contrast_50 : t.atoms.bg,
                ]}
                onLayout={handleLayout(index)}
                onPress={() => onPressItem(index)}>
                <Text
                  style={[
                    a.text_sm,
                    a.leading_snug,
                    a.text_center,
                    selectedPage === index
                      ? t.atoms.text
                      : t.atoms.text_contrast_high,
                  ]}>
                  {title}
                </Text>
                {hasNewBadge && (
                  <View
                    style={[
                      a.absolute,
                      a.ml_xs,
                      a.z_10,
                      a.rounded_xs,
                      a.top_0,
                      a.right_0,
                      {
                        backgroundColor: t.palette.primary_500,
                        height: 8,
                        width: 8,
                      },
                    ]}
                  />
                )}
              </Pressable>
            ))}
          </Animated.View>
        </DraggableScrollView>
      </BlockDrawerGesture>
    </Layout.Center>
  )
}

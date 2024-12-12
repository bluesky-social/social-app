import {useCallback} from 'react'
import {LayoutChangeEvent, ScrollView, StyleSheet, View} from 'react-native'
import Animated, {
  interpolate,
  runOnJS,
  runOnUI,
  scrollTo,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  onSelect?: (index: number) => void
  onPressSelected?: (index: number) => void
  dragProgress: SharedValue<number>
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>
}

const ITEM_PADDING = 10
const CONTENT_PADDING = 6
// How much of the previous/next item we're requiring
// when deciding whether to scroll into view on tap.
const OFFSCREEN_ITEM_WIDTH = 20

export function TabBar({
  testID,
  selectedPage,
  items,
  onSelect,
  onPressSelected,
  dragProgress,
  dragState,
}: TabBarProps) {
  const t = useTheme()
  const scrollElRef = useAnimatedRef<ScrollView>()
  const syncScrollState = useSharedValue<'synced' | 'unsynced' | 'needs-sync'>(
    'synced',
  )
  const didInitialScroll = useSharedValue(false)
  const contentSize = useSharedValue(0)
  const containerSize = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const layouts = useSharedValue<{x: number; width: number}[]>([])
  const textLayouts = useSharedValue<{width: number}[]>([])
  const itemsLength = items.length

  const scrollToOffsetJS = useCallback(
    (x: number) => {
      scrollElRef.current?.scrollTo({
        x,
        y: 0,
        animated: true,
      })
    },
    [scrollElRef],
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
        [0, itemsLength - 1],
        [0, freeSpace],
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

  // When we know the entire layout for the first time, scroll selection into view.
  useAnimatedReaction(
    () => layouts.get().length,
    (nextLayoutsLength, prevLayoutsLength) => {
      if (nextLayoutsLength !== prevLayoutsLength) {
        if (
          nextLayoutsLength === itemsLength &&
          didInitialScroll.get() === false
        ) {
          didInitialScroll.set(true)
          const progress = dragProgress.get()
          const offset = progressToOffset(progress)
          // It's unclear why we need to go back to JS here. It seems iOS-specific.
          runOnJS(scrollToOffsetJS)(offset)
        }
      }
    },
  )

  // When you swipe the pager, the tabbar should scroll automatically
  // as you're dragging the page and then even during deceleration.
  useAnimatedReaction(
    () => dragProgress.get(),
    (nextProgress, prevProgress) => {
      if (
        nextProgress !== prevProgress &&
        dragState.value !== 'idle' &&
        // This is only OK to do when we're 100% sure we're synced.
        // Otherwise, there would be a jump at the beginning of the swipe.
        syncScrollState.get() === 'synced'
      ) {
        const offset = progressToOffset(nextProgress)
        scrollTo(scrollElRef, offset, 0, false)
      }
    },
  )

  // If the syncing is currently off but you've just finished swiping,
  // it's an opportunity to resync. It won't feel disruptive because
  // you're not directly interacting with the tabbar at the moment.
  useAnimatedReaction(
    () => dragState.value,
    (nextDragState, prevDragState) => {
      if (
        nextDragState !== prevDragState &&
        nextDragState === 'idle' &&
        (syncScrollState.get() === 'unsynced' ||
          syncScrollState.get() === 'needs-sync')
      ) {
        const progress = dragProgress.get()
        const offset = progressToOffset(progress)
        scrollTo(scrollElRef, offset, 0, true)
        syncScrollState.set('synced')
      }
    },
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
        syncScrollState.set('synced')
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

  const onTextLayout = useCallback(
    (i: number, layout: {width: number}) => {
      'worklet'
      textLayouts.modify(ls => {
        ls[i] = layout
        return ls
      })
    },
    [textLayouts],
  )

  const indicatorStyle = useAnimatedStyle(() => {
    if (!_WORKLET) {
      return {opacity: 0}
    }
    const layoutsValue = layouts.get()
    const textLayoutsValue = textLayouts.get()
    if (
      layoutsValue.length !== itemsLength ||
      textLayoutsValue.length !== itemsLength
    ) {
      return {
        opacity: 0,
      }
    }
    if (textLayoutsValue.length === 1) {
      return {
        opacity: 1,
        transform: [
          {
            scaleX: textLayoutsValue[0].width / contentSize.get(),
          },
        ],
      }
    }
    return {
      opacity: 1,
      transform: [
        {
          translateX: interpolate(
            dragProgress.get(),
            layoutsValue.map((l, i) => i),
            layoutsValue.map(l => l.x + l.width / 2 - contentSize.get() / 2),
          ),
        },
        {
          scaleX: interpolate(
            dragProgress.get(),
            textLayoutsValue.map((l, i) => i),
            textLayoutsValue.map(l => l.width / contentSize.get()),
          ),
        },
      ],
    }
  })

  const onPressItem = useCallback(
    (index: number) => {
      runOnUI(onPressUIThread)(index)
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.(index)
      }
    },
    [onSelect, selectedPage, onPressSelected, onPressUIThread],
  )

  return (
    <View
      testID={testID}
      style={[t.atoms.bg, a.flex_row]}
      accessibilityRole="tablist">
      <ScrollView
        testID={`${testID}-selector`}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={scrollElRef}
        contentContainerStyle={styles.contentContainer}
        onLayout={e => {
          containerSize.set(e.nativeEvent.layout.width)
        }}
        onScrollBeginDrag={() => {
          // Remember that you've manually messed with the tabbar scroll.
          // This will disable auto-adjustment until after next pager swipe or item tap.
          syncScrollState.set('unsynced')
        }}
        onScroll={e => {
          scrollX.value = Math.round(e.nativeEvent.contentOffset.x)
        }}>
        <Animated.View
          onLayout={e => {
            contentSize.set(e.nativeEvent.layout.width)
          }}
          style={{flexDirection: 'row', flexGrow: 1}}>
          {items.map((item, i) => {
            return (
              <TabBarItem
                key={i}
                index={i}
                testID={testID}
                dragProgress={dragProgress}
                item={item}
                onPressItem={onPressItem}
                onItemLayout={onItemLayout}
                onTextLayout={onTextLayout}
              />
            )
          })}
          <Animated.View
            style={[
              indicatorStyle,
              {
                position: 'absolute',
                left: 0,
                bottom: 0,
                right: 0,
                borderBottomWidth: 2,
                borderColor: t.palette.primary_500,
              },
            ]}
          />
        </Animated.View>
      </ScrollView>
      <View style={[t.atoms.border_contrast_low, styles.outerBottomBorder]} />
    </View>
  )
}

function TabBarItem({
  index,
  testID,
  dragProgress,
  item,
  onPressItem,
  onItemLayout,
  onTextLayout,
}: {
  index: number
  testID: string | undefined
  dragProgress: SharedValue<number>
  item: string
  onPressItem: (index: number) => void
  onItemLayout: (index: number, layout: {x: number; width: number}) => void
  onTextLayout: (index: number, layout: {width: number}) => void
}) {
  const t = useTheme()
  const style = useAnimatedStyle(() => {
    if (!_WORKLET) {
      return {opacity: 0.7}
    }
    return {
      opacity: interpolate(
        dragProgress.get(),
        [index - 1, index, index + 1],
        [0.7, 1, 0.7],
        'clamp',
      ),
    }
  })

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      runOnUI(onItemLayout)(index, e.nativeEvent.layout)
    },
    [index, onItemLayout],
  )

  const handleTextLayout = useCallback(
    (e: LayoutChangeEvent) => {
      runOnUI(onTextLayout)(index, e.nativeEvent.layout)
    },
    [index, onTextLayout],
  )

  return (
    <View onLayout={handleLayout} style={{flexGrow: 1}}>
      <PressableWithHover
        testID={`${testID}-selector-${index}`}
        style={styles.item}
        hoverStyle={t.atoms.bg_contrast_25}
        onPress={() => onPressItem(index)}
        accessibilityRole="tab">
        <Animated.View style={[style, styles.itemInner]}>
          <Text
            emoji
            testID={testID ? `${testID}-${item}` : undefined}
            style={[styles.itemText, t.atoms.text, a.text_md, a.font_bold]}
            onLayout={handleTextLayout}>
            {item}
          </Text>
        </Animated.View>
      </PressableWithHover>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: CONTENT_PADDING,
  },
  item: {
    flexGrow: 1,
    paddingTop: 10,
    paddingHorizontal: ITEM_PADDING,
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  itemText: {
    lineHeight: 20,
    minWidth: 45,
    textAlign: 'center',
  },
  outerBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})

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

import {usePalette} from '#/lib/hooks/usePalette'
import {PressableWithHover} from '../util/PressableWithHover'
import {Text} from '../util/text/Text'

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

export function TabBar({
  testID,
  selectedPage,
  items,
  onSelect,
  onPressSelected,
  dragProgress,
  dragState,
}: TabBarProps) {
  const pal = usePalette('default')
  const scrollElRef = useAnimatedRef<ScrollView>()
  const isSyncingScroll = useSharedValue(true)
  const didInitialScroll = useSharedValue(false)
  const contentSize = useSharedValue(0)
  const containerSize = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const layouts = useSharedValue<{x: number; width: number}[]>([])
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

  const progressToOffset = useCallback(
    (progress: number) => {
      'worklet'
      const offsetPerPage =
        contentSize.get() + 2 * CONTENT_PADDING - containerSize.get()
      return (progress / (itemsLength - 1)) * offsetPerPage
    },
    [itemsLength, contentSize, containerSize],
  )

  // When we know the entire layout for the first time, scroll selection into view.
  useAnimatedReaction(
    () => {
      return {
        layoutsLength: layouts.get().length,
        containerSizeValue: containerSize.get(),
        contentSizeValue: contentSize.get(),
      }
    },
    (nextLayouts, prevLayouts) => {
      if (
        nextLayouts.containerSizeValue !== prevLayouts?.containerSizeValue ||
        nextLayouts.contentSizeValue !== prevLayouts?.contentSizeValue ||
        nextLayouts.layoutsLength !== prevLayouts?.layoutsLength
      ) {
        if (
          nextLayouts.containerSizeValue !== 0 &&
          nextLayouts.contentSizeValue !== 0 &&
          nextLayouts.layoutsLength === itemsLength &&
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
        isSyncingScroll.get() === true
      ) {
        const offset = progressToOffset(nextProgress)
        scrollTo(scrollElRef, offset, 0, false)
        return
      }
    },
  )

  // If you manually scrolled the tabbar, we'll mark the scroll as unsynced.
  // We'll re-sync it here (with an animation) if you interact with the pager again.
  // From that point on, it'll remain synced again (unless you scroll the tabbar again).
  useAnimatedReaction(
    () => dragState.value,
    (nextDragState, prevDragState) => {
      if (
        nextDragState !== prevDragState &&
        nextDragState === 'idle' &&
        isSyncingScroll.get() === false
      ) {
        const progress = dragProgress.get()
        const offset = progressToOffset(progress)
        scrollTo(scrollElRef, offset, 0, true)
        isSyncingScroll.set(true)
      }
    },
  )

  // When you press on the item, we'll scroll into view -- unless you previously
  // have scrolled the tabbar manually, in which case it'll re-sync on next press.
  const onPressUIThread = useCallback(
    (index: number) => {
      'worklet'
      if (isSyncingScroll.get() === true) {
        const progressDiff = index - dragProgress.get()
        const offsetDiff = progressToOffset(progressDiff)
        // TODO: Get into view if obscured
        const offset = scrollX.get() + offsetDiff
        scrollTo(scrollElRef, offset, 0, true)
      }
      isSyncingScroll.set(true)
    },
    [isSyncingScroll, scrollElRef, scrollX, dragProgress, progressToOffset],
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

  const indicatorStyle = useAnimatedStyle(() => {
    if (!_WORKLET) {
      return {opacity: 0}
    }
    const layoutsValue = layouts.get()
    if (
      layoutsValue.length !== itemsLength ||
      layoutsValue.some(l => l === undefined)
    ) {
      return {
        opacity: 0,
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
            layoutsValue.map((l, i) => i),
            layoutsValue.map(
              l => (l.width - ITEM_PADDING * 2) / contentSize.get(),
            ),
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
      style={[pal.view, styles.outer]}
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
          isSyncingScroll.set(false)
        }}
        onScroll={e => {
          scrollX.value = Math.round(e.nativeEvent.contentOffset.x)
        }}>
        <Animated.View
          onLayout={e => {
            contentSize.set(e.nativeEvent.layout.width)
          }}
          style={{flexDirection: 'row'}}>
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
                borderBottomWidth: 3,
                borderColor: pal.link.color,
              },
            ]}
          />
        </Animated.View>
      </ScrollView>
      <View style={[pal.border, styles.outerBottomBorder]} />
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
}: {
  index: number
  testID: string | undefined
  dragProgress: SharedValue<number>
  item: string
  onPressItem: (index: number) => void
  onItemLayout: (index: number, layout: {x: number; width: number}) => void
}) {
  const pal = usePalette('default')
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

  return (
    <View onLayout={handleLayout}>
      <PressableWithHover
        testID={`${testID}-selector-${index}`}
        style={styles.item}
        hoverStyle={pal.viewLight}
        onPress={() => onPressItem(index)}
        accessibilityRole="tab">
        <Animated.View style={[style, styles.itemInner]}>
          <Text
            emoji
            type="lg-bold"
            testID={testID ? `${testID}-${item}` : undefined}
            style={[pal.text, {lineHeight: 20}]}>
            {item}
          </Text>
        </Animated.View>
      </PressableWithHover>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
  },
  contentContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: CONTENT_PADDING,
  },
  item: {
    paddingTop: 10,
    paddingHorizontal: ITEM_PADDING,
    justifyContent: 'center',
  },
  itemInner: {
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  outerBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})

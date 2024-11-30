import {useCallback, useState} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import Animated, {
  interpolate,
  runOnUI,
  scrollTo,
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
}

export function TabBar({
  testID,
  selectedPage,
  items,
  onSelect,
  onPressSelected,
  dragGesture,
}: TabBarProps) {
  const pal = usePalette('default')
  const scrollElRef = useAnimatedRef()
  const isSyncingScroll = useSharedValue(true)
  const contentSize = useSharedValue(0)
  const containerSize = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const itemsLength = items.length
  const {dragProgress, dragState} = dragGesture

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
        const offsetPerPage = contentSize.get() - containerSize.get()
        const offset = (nextProgress / (itemsLength - 1)) * offsetPerPage
        scrollTo(scrollElRef, offset, 0, false)
        return
      }
    },
  )

  // If you manually scrolled the tabbar, we'll mark the scroll as unsynced.
  // We'll re-sync it here (with an animation) if you interact with the pager again.
  // From that point on, it'll remain synced again (unless you scroll the tabbar again).
  useAnimatedReaction(
    () => {
      return dragState.value
    },
    (nextDragState, prevDragState) => {
      if (
        nextDragState !== prevDragState &&
        nextDragState === 'idle' &&
        isSyncingScroll.get() === false
      ) {
        const offsetPerPage = contentSize.get() - containerSize.get()
        const progress = dragProgress.get()
        const offset = (progress / (itemsLength - 1)) * offsetPerPage
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
        const offsetPerPage = contentSize.get() - containerSize.get()
        const progressDiff = index - dragProgress.get()
        const offsetDiff = (progressDiff / (itemsLength - 1)) * offsetPerPage
        // TODO: Get into view if obscured
        const offset = scrollX.get() + offsetDiff
        scrollTo(scrollElRef, offset, 0, true)
      }
      isSyncingScroll.set(true)
    },
    [
      contentSize,
      containerSize,
      isSyncingScroll,
      itemsLength,
      scrollElRef,
      scrollX,
      dragProgress,
    ],
  )

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

  const [layouts, setLayouts] = useState([])
  const didLayout =
    layouts.length === items.length && layouts.every(l => l !== undefined)
  const indicatorStyle = useAnimatedStyle(() => {
    if (!didLayout) {
      return {}
    }
    return {
      transform: [
        {
          translateX: interpolate(
            dragProgress.get(),
            layouts.map((l, i) => i),
            layouts.map(l => l.x + l.width / 2 - contentSize.get() / 2),
          ),
        },
        {
          scaleX: interpolate(
            dragProgress.get(),
            layouts.map((l, i) => i),
            layouts.map(l => (l.width - 12) / contentSize.get()),
          ),
        },
      ],
    }
  })

  const onItemLayout = (e: LayoutChangeEvent, index: number) => {
    const l = e.nativeEvent.layout
    setLayouts(ls =>
      items.map((item, i) => {
        if (i === index) {
          return l
        } else {
          return ls[i]
        }
      }),
    )
  }

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
              <View key={i} onLayout={e => onItemLayout(e, i)}>
                <TabBarItem
                  index={i}
                  testID={testID}
                  selected={i === selectedPage}
                  item={item}
                  onPressItem={onPressItem}
                />
              </View>
            )
          })}
          {didLayout && (
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
          )}
        </Animated.View>
      </ScrollView>
      <View style={[pal.border, styles.outerBottomBorder]} />
    </View>
  )
}

function TabBarItem({
  index,
  testID,
  selected,
  item,
  onPressItem,
}: {
  index: number
  testID: string | undefined
  selected: boolean
  item: string
  onPressItem: (index: number) => void
}) {
  const pal = usePalette('default')
  return (
    <PressableWithHover
      testID={`${testID}-selector-${index}`}
      style={styles.item}
      hoverStyle={pal.viewLight}
      onPress={() => onPressItem(index)}
      accessibilityRole="tab">
      <View style={[styles.itemInner]}>
        <Text
          emoji
          type="lg-bold"
          testID={testID ? `${testID}-${item}` : undefined}
          style={[selected ? pal.text : pal.textLight, {lineHeight: 20}]}>
          {item}
        </Text>
      </View>
    </PressableWithHover>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
  },
  contentContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
  },
  item: {
    paddingTop: 10,
    paddingHorizontal: 10,
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

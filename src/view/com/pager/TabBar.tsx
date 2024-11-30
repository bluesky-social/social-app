import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {LayoutChangeEvent, ScrollView, StyleSheet, View} from 'react-native'
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {isNative} from '#/platform/detection'
import {PressableWithHover} from '../util/PressableWithHover'
import {Text} from '../util/text/Text'
import {DraggableScrollView} from './DraggableScrollView'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  indicatorColor?: string
  onSelect?: (index: number) => void
  onPressSelected?: (index: number) => void
  pageOffset: SharedValue<number>
}

// How much of the previous/next item we're showing
// to give the user a hint there's more to scroll.
const OFFSCREEN_ITEM_WIDTH = 20
const ITEM_MOBILE_PADDING_HORIZONTAL = 10
const ITEM_DESKTOP_PADDING_HORIZONTAL = 14
const FALLBACK_INTERPOLATION_RANGE = [0, 0]

export function TabBar({
  testID,
  selectedPage,
  items,
  indicatorColor,
  onSelect,
  onPressSelected,
  pageOffset,
}: TabBarProps) {
  const {isDesktop, isTablet} = useWebMediaQueries()

  const pal = usePalette('default')
  const scrollElRef = useRef<ScrollView>(null)
  const itemRefs = useRef<Array<Element>>([])
  const [itemXsAndWidths, setItemXsAndWidths] = useState<
    {x: number; width: number}[]
  >([])

  const shouldShowDesktopStyles = isDesktop || isTablet
  const ITEM_PADDING_HORIZONTAL = shouldShowDesktopStyles
    ? ITEM_DESKTOP_PADDING_HORIZONTAL
    : ITEM_MOBILE_PADDING_HORIZONTAL

  // ranges for indicator width and x position interpolation
  const {inputRange, outputRangeWidth, outputRangeX} = useMemo(() => {
    // before layout of items is captured; interpolation of inputs and outpouts always needs an array of at least 2 items
    if (itemXsAndWidths.length < 2) {
      return {
        inputRange: FALLBACK_INTERPOLATION_RANGE,
        outputRangeWidth: FALLBACK_INTERPOLATION_RANGE,
        outputRangeX: FALLBACK_INTERPOLATION_RANGE,
      }
    }

    return {
      inputRange: itemXsAndWidths.map((_, i) => i),
      outputRangeWidth: itemXsAndWidths.map(
        item => item.width - ITEM_PADDING_HORIZONTAL * 2,
      ),
      outputRangeX: itemXsAndWidths?.map(
        item => item.x + ITEM_PADDING_HORIZONTAL,
      ),
    }
  }, [ITEM_PADDING_HORIZONTAL, itemXsAndWidths])

  const tabIndicatorStyle = useAnimatedStyle(() => ({
    width: interpolate(pageOffset.value, inputRange, outputRangeWidth, 'clamp'),
    transform: [
      {
        translateX: interpolate(
          pageOffset.value,
          inputRange,
          outputRangeX,
          'clamp',
        ),
      },
    ],
  }))

  const styles = shouldShowDesktopStyles ? desktopStyles : mobileStyles

  useEffect(() => {
    if (isNative) {
      // On native, the primary interaction is swiping.
      // We adjust the scroll little by little on every tab change.
      // Scroll into view but keep the end of the previous item visible.
      let x = itemXsAndWidths[selectedPage]?.x || 0
      x = Math.max(0, x - OFFSCREEN_ITEM_WIDTH)
      scrollElRef.current?.scrollTo({x})
    } else {
      // On the web, the primary interaction is tapping.
      // Scrolling under tap feels disorienting so only adjust the scroll offset
      // when tapping on an item out of view--and we adjust by almost an entire page.
      const parent = scrollElRef?.current?.getScrollableNode?.()
      if (!parent) {
        return
      }
      const parentRect = parent.getBoundingClientRect()
      if (!parentRect) {
        return
      }
      const {
        left: parentLeft,
        right: parentRight,
        width: parentWidth,
      } = parentRect
      const child = itemRefs.current[selectedPage]
      if (!child) {
        return
      }
      const childRect = child.getBoundingClientRect?.()
      if (!childRect) {
        return
      }
      const {left: childLeft, right: childRight, width: childWidth} = childRect
      let dx = 0
      if (childRight >= parentRight) {
        dx += childRight - parentRight
        dx += parentWidth - childWidth - OFFSCREEN_ITEM_WIDTH
      } else if (childLeft <= parentLeft) {
        dx -= parentLeft - childLeft
        dx -= parentWidth - childWidth - OFFSCREEN_ITEM_WIDTH
      }
      let x = parent.scrollLeft + dx
      x = Math.max(0, x)
      x = Math.min(x, parent.scrollWidth - parentWidth)
      if (dx !== 0) {
        parent.scroll({
          left: x,
          behavior: 'smooth',
        })
      }
    }
  }, [scrollElRef, selectedPage, styles, itemXsAndWidths])

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.(index)
      }
    },
    [onSelect, selectedPage, onPressSelected],
  )

  // calculates the x position and width of each item on mount and on layout change
  const onItemLayout = React.useCallback(
    (e: LayoutChangeEvent, index: number) => {
      const x = e.nativeEvent.layout.x
      const width = e.nativeEvent.layout.width
      setItemXsAndWidths(prev => {
        const itemsLayouts = [...prev]
        itemsLayouts[index] = {x, width}
        return itemsLayouts
      })
    },
    [],
  )

  return (
    <View
      testID={testID}
      style={[pal.view, styles.outer]}
      accessibilityRole="tablist">
      <DraggableScrollView
        testID={`${testID}-selector`}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={scrollElRef}
        contentContainerStyle={styles.contentContainer}>
        {items.map((item, i) => {
          const selected = i === selectedPage
          return (
            <PressableWithHover
              testID={`${testID}-selector-${i}`}
              key={`${item}-${i}`}
              ref={node => (itemRefs.current[i] = node as any)}
              onLayout={e => onItemLayout(e, i)}
              style={styles.item}
              hoverStyle={pal.viewLight}
              onPress={() => onPressItem(i)}
              accessibilityRole="tab">
              <View style={styles.itemInner}>
                <Text
                  emoji
                  type={isDesktop || isTablet ? 'xl-bold' : 'lg-bold'}
                  testID={testID ? `${testID}-${item}` : undefined}
                  style={[
                    selected ? pal.text : pal.textLight,
                    {lineHeight: 20},
                  ]}>
                  {item}
                </Text>
              </View>
            </PressableWithHover>
          )
        })}
        <Animated.View
          style={[
            tabIndicatorStyle,
            mobileStyles.indicatorStyle,
            {backgroundColor: indicatorColor || pal.colors.link},
          ]}
        />
      </DraggableScrollView>

      <View style={[pal.border, styles.outerBottomBorder]} />
    </View>
  )
}

const desktopStyles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    width: 598,
  },
  contentContainer: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  item: {
    paddingTop: 14,
    paddingHorizontal: ITEM_DESKTOP_PADDING_HORIZONTAL,
    justifyContent: 'center',
  },
  itemInner: {
    paddingBottom: 12,
  },
  outerBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})

const mobileStyles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
  },
  contentContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
  },
  item: {
    paddingTop: 10,
    paddingHorizontal: ITEM_MOBILE_PADDING_HORIZONTAL,
    justifyContent: 'center',
  },
  itemInner: {
    paddingBottom: 10,
  },
  outerBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  indicatorStyle: {height: 3, position: 'absolute', bottom: 0, left: 0},
})

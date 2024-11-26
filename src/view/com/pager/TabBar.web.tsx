import {useCallback, useEffect, useMemo, useRef} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
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
}

// How much of the previous/next item we're showing
// to give the user a hint there's more to scroll.
const OFFSCREEN_ITEM_WIDTH = 20

export function TabBar({
  testID,
  selectedPage,
  items,
  indicatorColor,
  onSelect,
  onPressSelected,
}: TabBarProps) {
  const pal = usePalette('default')
  const scrollElRef = useRef<ScrollView>(null)
  const itemRefs = useRef<Array<Element>>([])
  const indicatorStyle = useMemo(
    () => ({borderBottomColor: indicatorColor || pal.colors.link}),
    [indicatorColor, pal],
  )
  const {isDesktop, isTablet} = useWebMediaQueries()
  const styles = isDesktop || isTablet ? desktopStyles : mobileStyles

  useEffect(() => {
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
  }, [scrollElRef, selectedPage, styles])

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.(index)
      }
    },
    [onSelect, selectedPage, onPressSelected],
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
              style={styles.item}
              hoverStyle={pal.viewLight}
              onPress={() => onPressItem(i)}
              accessibilityRole="tab">
              <View style={[styles.itemInner, selected && indicatorStyle]}>
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
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  itemInner: {
    paddingBottom: 12,
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

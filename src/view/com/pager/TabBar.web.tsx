import {useCallback, useEffect, useRef} from 'react'
import {type ScrollView, StyleSheet, View} from 'react-native'

import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Text} from '#/components/Typography'
import {PressableWithHover} from '../util/PressableWithHover'
import {DraggableScrollView} from './DraggableScrollView'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  indicatorColor?: string
  backgroundColor?: string

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
  onSelect,
  onPressSelected,
}: TabBarProps) {
  const t = useTheme()
  const scrollElRef = useRef<ScrollView>(null)
  const itemRefs = useRef<Array<Element>>([])
  const {gtMobile} = useBreakpoints()
  const styles = gtMobile ? desktopStyles : mobileStyles

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
      style={[t.atoms.bg, styles.outer]}
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
              hoverStyle={t.atoms.bg_contrast_25}
              onPress={() => onPressItem(i)}
              accessibilityRole="tab">
              <View style={styles.itemInner}>
                <Text
                  emoji
                  testID={testID ? `${testID}-${item}` : undefined}
                  style={[
                    styles.itemText,
                    selected ? t.atoms.text : t.atoms.text_contrast_medium,
                    a.text_md,
                    a.font_bold,
                    {lineHeight: 20},
                  ]}>
                  {item}
                  <View
                    style={[
                      styles.itemIndicator,
                      selected && {
                        backgroundColor: t.palette.primary_500,
                      },
                    ]}
                  />
                </Text>
              </View>
            </PressableWithHover>
          )
        })}
      </DraggableScrollView>
      <View style={[t.atoms.border_contrast_low, styles.outerBottomBorder]} />
    </View>
  )
}

const desktopStyles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    width: 600,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  item: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingTop: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    ...web({overflowX: 'hidden'}),
  },
  itemText: {
    textAlign: 'center',
    paddingBottom: 10 + 3,
  },
  itemIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    left: '50%',
    transform: 'translateX(-50%)',
    minWidth: 45,
    width: '100%',
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
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
  },
  item: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingTop: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  itemInner: {
    flexGrow: 1,
    alignItems: 'center',
    ...web({overflowX: 'hidden'}),
  },
  itemText: {
    textAlign: 'center',
    paddingBottom: 10 + 3,
  },
  itemIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    left: '50%',
    transform: 'translateX(-50%)',
    minWidth: 45,
    width: '100%',
  },
  outerBottomBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})

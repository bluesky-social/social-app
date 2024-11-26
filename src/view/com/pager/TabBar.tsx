import {useCallback, useMemo, useRef} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'

import {usePalette} from '#/lib/hooks/usePalette'
import {PressableWithHover} from '../util/PressableWithHover'
import {Text} from '../util/text/Text'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  indicatorColor?: string
  onSelect?: (index: number) => void
  onPressSelected?: (index: number) => void
}

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
  const indicatorStyle = useMemo(
    () => ({borderBottomColor: indicatorColor || pal.colors.link}),
    [indicatorColor, pal],
  )

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
      <ScrollView
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
              style={styles.item}
              hoverStyle={pal.viewLight}
              onPress={() => onPressItem(i)}
              accessibilityRole="tab">
              <View style={[styles.itemInner, selected && indicatorStyle]}>
                <Text
                  emoji
                  type="lg-bold"
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
      </ScrollView>
      <View style={[pal.border, styles.outerBottomBorder]} />
    </View>
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

import {useCallback, useMemo} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import Animated, {
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

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.(index)
      }
    },
    [onSelect, selectedPage, onPressSelected],
  )

  const contentSize = useSharedValue(0)
  const containerSize = useSharedValue(0)
  const itemsLength = items.length
  const {dragPage, dragProgress} = dragGesture

  useAnimatedReaction(
    () => dragPage.get(),
    (page, prevPage) => {
      if (page !== prevPage) {
        const offsetPerPage = contentSize.get() - containerSize.get()
        const offset = (dragPage.get() / (itemsLength - 1)) * offsetPerPage
        scrollTo(scrollElRef, offset, 0, false)
      }
    },
  )

  const contentStyle = useAnimatedStyle(() => {
    const offsetPerPage = contentSize.get() - containerSize.get()
    const offset = (dragProgress.get() / (itemsLength - 1)) * offsetPerPage
    return {
      transform: [{translateX: -offset}],
    }
  })

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
        }}>
        <Animated.View
          onLayout={e => {
            contentSize.set(e.nativeEvent.layout.width)
          }}
          style={[
            contentStyle,
            {
              flexDirection: 'row',
            },
          ]}>
          {items.map((item, i) => {
            return (
              <TabBarItem
                key={i}
                index={i}
                testID={testID}
                selected={i === selectedPage}
                item={item}
                onPressItem={onPressItem}
              />
            )
          })}
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
  const indicatorStyle = useMemo(
    () => ({borderBottomColor: pal.colors.link}),
    [pal],
  )
  return (
    <PressableWithHover
      testID={`${testID}-selector-${index}`}
      style={styles.item}
      hoverStyle={pal.viewLight}
      onPress={() => onPressItem(index)}
      accessibilityRole="tab">
      <View style={[styles.itemInner, selected && indicatorStyle]}>
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

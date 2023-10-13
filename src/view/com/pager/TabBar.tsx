import React, {useMemo, useCallback} from 'react'
import {useAnimatedReaction, useAnimatedRef, useDerivedValue, useSharedValue, measure, scrollTo} from 'react-native-reanimated'
import {Dimensions, StyleSheet, View, ScrollView} from 'react-native'
import {Text} from '../util/text/Text'
import {PressableWithHover} from '../util/PressableWithHover'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {isWeb} from 'platform/detection'
import {DraggableScrollView} from './DraggableScrollView'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  indicatorColor?: string
  onSelect?: (index: number) => void
  onPressSelected?: () => void
}

const SCREEN = Dimensions.get('screen')

export function TabBar({
  testID,
  dragProgress,
  selectedPage,
  items,
  indicatorColor,
  onSelect,
  onPressSelected,
}: TabBarProps) {
  const pal = usePalette('default')
  const contentSize = useSharedValue(0)
  const scrollElRef = useAnimatedRef(null)
  const indicatorStyle = useMemo(
    () => ({borderBottomColor: indicatorColor || pal.colors.link}),
    [indicatorColor, pal],
  )
  const {isDesktop, isTablet} = useWebMediaQueries()

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.()
      }
    },
    [onSelect, selectedPage, onPressSelected],
  )

  useAnimatedReaction(() => {
    return dragProgress.value * (contentSize.value - SCREEN.width)
  }, (nextX, prevX) => {
    if (prevX !== nextX) {
      scrollTo(scrollElRef, nextX, 0, false);
    }
  }, [dragProgress, contentSize])

  const styles = isDesktop || isTablet ? desktopStyles : mobileStyles

  return (
    <View testID={testID} style={[pal.view, styles.outer]}>
      <DraggableScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={scrollElRef}
        contentContainerStyle={styles.contentContainer}
        onContentSizeChange={e => {
          contentSize.value = e
        }}>
        {items.map((item, i) => {
          const selected = i === selectedPage
          return (
            <PressableWithHover
              key={item}
              style={[styles.item, selected && indicatorStyle]}
              hoverStyle={pal.viewLight}
              onPress={() => onPressItem(i)}>
              <Text
                type={isDesktop || isTablet ? 'xl-bold' : 'lg-bold'}
                testID={testID ? `${testID}-${item}` : undefined}
                style={selected ? pal.text : pal.textLight}>
                {item}
              </Text>
            </PressableWithHover>
          )
        })}
      </DraggableScrollView>
    </View>
  )
}

const desktopStyles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    width: 598,
  },
  contentContainer: {
    columnGap: 8,
    marginLeft: 14,
    paddingRight: 14,
    backgroundColor: 'transparent',
  },
  item: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
})

const mobileStyles = StyleSheet.create({
  outer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    maxWidth: '100%',
  },
  contentContainer: {
    columnGap: isWeb ? 0 : 20,
    marginLeft: isWeb ? 0 : 18,
    paddingRight: isWeb ? 0 : 36,
    backgroundColor: 'transparent',
  },
  item: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: isWeb ? 8 : 0,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
  },
})

import React, {useMemo, useCallback, useEffect, useState} from 'react'
import Animated, {useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useDerivedValue, useSharedValue, measure, interpolate, interpolateColor, scrollTo, withSpring} from 'react-native-reanimated'
import {Dimensions, StyleSheet, View, ScrollView} from 'react-native'
import {PressableWithHover} from '../util/PressableWithHover'
import {usePalette} from 'lib/hooks/usePalette'
import {useTheme} from 'lib/ThemeContext'
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
  dragState,
  selectedPage,
  items,
  indicatorColor,
  onSelect,
  onPressSelected,
}: TabBarProps) {
  const pal = usePalette('default')
  const contentSize = useSharedValue(0)
  const scrollElRef = useAnimatedRef(null)
  const {isDesktop, isTablet} = useWebMediaQueries()
  const [layouts, setLayouts] = useState([])
  const shouldSync = useSharedValue(true)
  const scrollX = useSharedValue(0)
  const didScroll = useSharedValue(false)

  const indicatorStyle = useAnimatedStyle(() => {
    if (layouts.length < items.length - 1 || layouts.some(l => l === undefined)) {
      return {}
    }
    return {
      width: interpolate(dragProgress.value, layouts.map((l, i) => i), layouts.map(l => l.width)),
      left: interpolate(dragProgress.value, layouts.map((l, i) => i), layouts.map(l => l.x)),
    }
  })

  const onPressItem = (index: number) => {
    if (!didScroll.value) {
      scrollElRef.current.scrollTo({
        x: scrollX.value + ((index - selectedPage) / (items.length - 1)) * (contentSize.value - SCREEN.width),
        animated: true
      })
    }
    didScroll.value = false
    onSelect?.(index)
    if (index === selectedPage) {
      onPressSelected?.()
    }
  };

  useAnimatedReaction(() => {
    return (dragProgress.value / (items.length - 1)) * (contentSize.value - SCREEN.width)
  }, (nextX, prevX) => {
    if (shouldSync.value && prevX !== nextX) {
      scrollTo(scrollElRef, nextX, 0, false);
    }
  })

  useAnimatedReaction(() => {
    return dragState.value
  }, (nextDragState, prevDragState) => {
    if (nextDragState === 'idle' && nextDragState !== prevDragState) {
      const nextX = (dragProgress.value / (items.length - 1)) * (contentSize.value - SCREEN.width)
      scrollTo(scrollElRef, nextX, 0, true);
      shouldSync.value = true
      didScroll.value = false
    }
  })

  const onItemLayout = (e: LayoutChangeEvent, index: number) => {
    const l = e.nativeEvent.layout
    setLayouts(ls => items.map((item, i) => {
      if (i === index) {
        return l
      } else {
        return ls[i]
      }
    }))
  }

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
        }}
        onScrollBeginDrag={e => {
          shouldSync.value = false
          didScroll.value = true
        }}
        onScroll={e => {
          scrollX.value = Math.round(e.nativeEvent.contentOffset.x)
        }}
        scrollEventThrottle={16}>
        {items.map((item, i) => {
          return (
            <PressableWithHover
              key={item}
              onLayout={e => onItemLayout(e, i)}
              style={[styles.item]}
              hoverStyle={pal.viewLight}
              onPress={() => onPressItem(i)}>
              <MaybeHighlightedText
                type={isDesktop || isTablet ? 'xl-bold' : 'lg-bold'}
                testID={testID ? `${testID}-${item}` : undefined}
                approxIndex={dragProgress}
                index={i}>
                {item}
              </MaybeHighlightedText>
            </PressableWithHover>
          )
        })}
        <Animated.View
          style={[{
            position: 'absolute',
            bottom: 0,
            height: 3,
            backgroundColor: indicatorColor || pal.colors.link,
          }, indicatorStyle]}
        />
      </DraggableScrollView>

    </View>
  )
}

export function MaybeHighlightedText({ approxIndex, index, style, type, ...rest }) {
  const pal = usePalette('default')
  const theme = useTheme()
  const typography = theme.typography[type]
  const animatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(Math.min(Math.abs(approxIndex.value - index), 1), [0, 1], [pal.text.color, pal.textLight.color])
  }))
  return (
    <Animated.Text {...rest} style={[style, typography, animatedStyle]} />
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

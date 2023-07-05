import {
  Image,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {isDesktopWeb, isMobileWeb} from 'platform/detection'

import {DraggableScrollView} from './DraggableScrollView'
import {PressableWithHover} from '../util/PressableWithHover'
import {Text} from '../util/text/Text'
import {colors} from 'lib/styles'
import {solarplexTheme} from 'lib/SolarplexTheme'
import {usePalette} from 'lib/hooks/usePalette'

export interface TabBarProps {
  testID?: string
  selectedPage: number
  items: string[]
  indicatorColor?: string
  onSelect?: (index: number) => void
  onPressSelected?: () => void
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
  const [itemXs, setItemXs] = useState<number[]>([])
  const indicatorStyle = useMemo(
    () => ({borderBottomColor: indicatorColor || pal.colors.link}),
    [indicatorColor, pal],
  )

  // scrolls to the selected item when the page changes
  useEffect(() => {
    scrollElRef.current?.scrollTo({
      x: itemXs[selectedPage] || 0,
    })
  }, [scrollElRef, itemXs, selectedPage])

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.()
      }
    },
    [onSelect, selectedPage, onPressSelected],
  )

  // calculates the x position of each item on mount and on layout change
  const onItemLayout = React.useCallback(
    (e: LayoutChangeEvent, index: number) => {
      const x = e.nativeEvent.layout.x
      setItemXs(prev => {
        const Xs = [...prev]
        Xs[index] = x
        return Xs
      })
    },
    [],
  )

  console.log('WORLD', items)

  return (
    <View testID={testID} style={[pal.view, styles.outer]}>
      <DraggableScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={scrollElRef}
        contentContainerStyle={styles.contentContainer}>
        {items.map((item, i) => {
          const selected = i === selectedPage
          return (
            <>
              <View style={styles.container}>
                <PressableWithHover
                  key={item}
                  onLayout={e => onItemLayout(e, i)}
                  style={[styles.item, selected && indicatorStyle]}
                  hoverStyle={pal.viewLight}
                  onPress={() => onPressItem(i)}>
                  {item === 'Solana' && (
                    <Image
                      source={require('./sol-logo.png')}
                      style={styles.imageStyle}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  )}
                  {item === 'Home' && (
                    <Image
                      source={require('./home.png')}
                      style={styles.imageStyle}
                      resizeMode="cover"
                      accessibilityIgnoresInvertColors
                    />
                  )}
                </PressableWithHover>
                <Text
                  type={isDesktopWeb ? 'xl-bold' : 'lg-bold'}
                  testID={testID ? `${testID}-${item}` : undefined}
                  style={selected ? pal.text : pal.textLight}>
                  {item}
                </Text>
              </View>
            </>
          )
        })}
      </DraggableScrollView>
    </View>
  )
}

const styles = isDesktopWeb
  ? StyleSheet.create({
      imageStyle: {
        width: 50,
        height: 50,
      },
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 5,
      },
      outer: {
        flexDirection: 'row',
        width: 598,
        marginBottom: 10,
      },
      contentContainer: {
        columnGap: 8,
        marginLeft: 14,
        paddingRight: 14,
        backgroundColor: 'transparent',
      },
      item: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 75,
        height: 75,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: colors.splx.neutral[30],
        color: '#6E59B1',
        marginHorizontal: 4,
        marginVertical: 4,
        backgroundColor: '#F5F2F9',
      },
    })
  : StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
      },
      outer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
      },
      contentContainer: {
        columnGap: isMobileWeb ? 0 : 20,
        marginLeft: isMobileWeb ? 0 : 18,
        paddingRight: isMobileWeb ? 0 : 36,
        marginBottom: 4,
        backgroundColor: 'transparent',
      },
      imageStyle: {
        width: 30,
        height: 30,
      },
      item: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 10,
        borderRadius: 40,
        width: 50,
        height: 50,
        color: '#6E59B1',
        borderWidth: 1,
        borderColor: colors.splx.neutral[30],
        paddingHorizontal: isMobileWeb ? 8 : 0,
      },
    })

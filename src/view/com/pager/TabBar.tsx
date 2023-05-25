import React, {
  useRef,
  createRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {StyleSheet, View, ScrollView} from 'react-native'
import {Text} from '../util/text/Text'
import {PressableWithHover} from '../util/PressableWithHover'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {DraggableScrollView} from './DraggableScrollView'

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
  const itemRefs = useMemo(
    () => Array.from({length: items.length}).map(() => createRef<View>()),
    [items.length],
  )
  const indicatorStyle = useMemo(
    () => ({borderBottomColor: indicatorColor || pal.colors.link}),
    [indicatorColor, pal],
  )

  useEffect(() => {
    scrollElRef.current?.scrollTo({x: itemXs[selectedPage] || 0})
  }, [scrollElRef, itemXs, selectedPage])

  const onPressItem = useCallback(
    (index: number) => {
      onSelect?.(index)
      if (index === selectedPage) {
        onPressSelected?.()
      }
    },
    [onSelect, onPressSelected, selectedPage],
  )

  const onLayout = React.useCallback(() => {
    const promises = []
    for (let i = 0; i < items.length; i++) {
      promises.push(
        new Promise<number>(resolve => {
          if (!itemRefs[i].current) {
            return resolve(0)
          }

          itemRefs[i].current?.measure((x: number) => resolve(x))
        }),
      )
    }
    Promise.all(promises).then((Xs: number[]) => {
      setItemXs(Xs)
    })
  }, [itemRefs, setItemXs, items.length])

  return (
    <View testID={testID} style={[pal.view, styles.outer]}>
      <DraggableScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={scrollElRef}
        contentContainerStyle={styles.contentContainer}
        onLayout={onLayout}>
        {items.map((item, i) => {
          const selected = i === selectedPage
          return (
            <PressableWithHover
              ref={itemRefs[i]}
              key={item}
              style={[styles.item, selected && indicatorStyle]}
              hoverStyle={pal.viewLight}
              onPress={() => onPressItem(i)}>
              <Text
                type="lg-bold"
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

const styles = isDesktopWeb
  ? StyleSheet.create({
      outer: {
        flexDirection: 'row',
        width: 598,
        paddingHorizontal: 14,
      },
      contentContainer: {},
      item: {
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
      },
    })
  : StyleSheet.create({
      outer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
      },
      contentContainer: {
        columnGap: 14,
        marginLeft: 14,
        paddingRight: 28,
        backgroundColor: 'transparent',
      },
      item: {
        paddingTop: 8,
        paddingBottom: 8,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
      },
    })

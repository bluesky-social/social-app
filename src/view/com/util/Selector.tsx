import {createRef, useMemo, useRef, useState} from 'react'
import {Animated, Pressable, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {Text} from './text/Text'

interface Layout {
  x: number
  width: number
}

export function Selector({
  selectedIndex,
  items,
  panX,
  onSelect,
}: {
  selectedIndex: number
  items: string[]
  panX: Animated.Value
  onSelect?: (index: number) => void
}) {
  const {_} = useLingui()
  const containerRef = useRef<View>(null)
  const pal = usePalette('default')
  const [itemLayouts, setItemLayouts] = useState<undefined | Layout[]>(
    undefined,
  )
  const itemRefs = useMemo(
    () => Array.from({length: items.length}).map(() => createRef<View>()),
    [items.length],
  )

  const currentLayouts = useMemo(() => {
    const left = itemLayouts?.[selectedIndex - 1] || {x: 0, width: 0}
    const middle = itemLayouts?.[selectedIndex] || {x: 0, width: 0}
    const right = itemLayouts?.[selectedIndex + 1] || {
      x: middle.x + 20,
      width: middle.width,
    }
    return [left, middle, right]
  }, [selectedIndex, itemLayouts])

  const underlineStyle = {
    backgroundColor: pal.colors.text,
    left: panX.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [
        currentLayouts[0].x,
        currentLayouts[1].x,
        currentLayouts[2].x,
      ],
    }),
    width: panX.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [
        currentLayouts[0].width,
        currentLayouts[1].width,
        currentLayouts[2].width,
      ],
    }),
  }

  const onLayout = () => {
    const promises = []
    for (let i = 0; i < items.length; i++) {
      promises.push(
        new Promise<Layout>(resolve => {
          if (!containerRef.current || !itemRefs[i].current) {
            return resolve({x: 0, width: 0})
          }
          itemRefs[i].current?.measureLayout(
            containerRef.current,
            (x: number, _y: number, width: number) => {
              resolve({x, width})
            },
          )
        }),
      )
    }
    Promise.all(promises).then((layouts: Layout[]) => {
      setItemLayouts(layouts)
    })
  }

  const onPressItem = (index: number) => {
    onSelect?.(index)
  }

  const numItems = items.length

  return (
    <View
      style={[pal.view, styles.outer]}
      onLayout={onLayout}
      ref={containerRef}>
      <Animated.View style={[styles.underline, underlineStyle]} />
      {items.map((item, i) => {
        const selected = i === selectedIndex
        return (
          <Pressable
            testID={`selector-${i}`}
            key={item}
            onPress={() => onPressItem(i)}
            accessibilityLabel={_(msg`Select ${item}`)}
            accessibilityHint={_(msg`Select option ${i} of ${numItems}`)}>
            <View style={styles.item} ref={itemRefs[i]}>
              <Text
                style={
                  selected
                    ? [styles.labelSelected, pal.text]
                    : [styles.label, pal.textLight]
                }>
                {item}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 14,
  },
  item: {
    marginRight: 14,
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: '600',
  },
  labelSelected: {
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    height: 4,
    bottom: 0,
  },
})

import React from 'react'
import {
  FlatList,
  LayoutChangeEvent,
  ListRenderItemInfo,
  View,
  ViewToken,
} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {ClipClop as ClipClopInterface} from '#/components/ClipClopTest/RandomClipClops'
import {Text} from '#/components/Typography'

function ClipClop({message}: {message: ClipClopInterface}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.px_md,
        a.py_md,
        a.my_md,
        {
          backgroundColor: t.palette.primary_500,
          maxWidth: '50%',
          borderRadius: 10,
        },
      ]}>
      <Text style={{lineHeight: 1.2}}>{message.text}</Text>
    </View>
  )
}

function renderItem({item}: ListRenderItemInfo<ClipClopInterface>) {
  return <ClipClop message={item} />
}

function keyExtractor(item: ClipClopInterface, index: number) {
  return `${item.id}-${index}`
}

function HeaderPlaceholder({height}: {height: number}) {
  return <View style={{height}} />
}

export function ClipClopList({clipClops}: {clipClops: ClipClopInterface[]}) {
  const flatlistRef = React.useRef<FlatList>(null)
  const contentHeight = React.useRef(0)

  const totalClipClops = React.useRef(0)

  const isAtBottom = React.useRef(true)
  const [placeholderHeight, setPlaceholderHeight] = React.useState(0)

  // This creates a placeholder that adjusts with the whitespace above the last chat item
  const onScreenLayout = React.useCallback((e: LayoutChangeEvent) => {
    setPlaceholderHeight(e.nativeEvent.layout.height)
  }, [])

  const onContentSizeChange = React.useCallback(
    (_: number, height: number) => {
      if (isAtBottom.current) {
        flatlistRef.current?.scrollToOffset({offset: height, animated: true})
      }

      contentHeight.current = height
      totalClipClops.current = clipClops.length
    },
    [clipClops],
  )

  const [onViewableItemsChanged, viewabilityConfig] = React.useMemo(() => {
    return [
      (info: {viewableItems: Array<ViewToken>; changed: Array<ViewToken>}) => {
        const lastVisibleItem =
          info.viewableItems[info.viewableItems.length - 1]
        const lastViewableIndex = lastVisibleItem?.index ?? -1

        isAtBottom.current = lastViewableIndex >= totalClipClops.current - 2
      },
      {
        itemVisiblePercentThreshold: 100,
        minimumViewTime: 100,
      },
    ]
  }, [])

  return (
    <View style={{flex: 1}} onLayout={onScreenLayout}>
      <FlatList
        data={clipClops}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        // maintainVisibleContentPosition={{
        //   minIndexForVisible: 0,
        // }}
        // ListHeaderComponent={<HeaderPlaceholder height={placeholderHeight} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ref={flatlistRef}
        onContentSizeChange={onContentSizeChange}
      />
    </View>
  )
}

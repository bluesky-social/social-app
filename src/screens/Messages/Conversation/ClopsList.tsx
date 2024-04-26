import React from 'react'
import {FlatList, View, ViewToken} from 'react-native'

import {ClopInput} from '#/screens/Messages/Conversation/ClopInput'
import {ClopItem} from '#/screens/Messages/Conversation/ClopItem'
import {
  ClipClop,
  placeholderClops,
} from '#/screens/Messages/Conversation/RandomClipClops'
import {Loader} from '#/components/Loader'

function MaybeLoader({isLoading}: {isLoading: boolean}) {
  return (
    <View
      style={{
        height: 50,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {isLoading && <Loader size="xl" />}
    </View>
  )
}

function renderItem({item}: {item: ClipClop}) {
  return <ClopItem item={item} />
}

// Generate unique key list item.
const generateUniqueKey = () => `_${Math.random().toString(36).substr(2, 9)}`

function onScrollToEndFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export const ClopsList = () => {
  const flatListRef = React.useRef<FlatList>(null)

  // Whenever we reach the end (visually the top), we don't want to keep calling it. We will set `isFetching` to true
  // once the request for new posts starts. Then, we will change it back to false after the content size changes.
  const isFetching = React.useRef(false)

  // We use this to know if we should scroll after a new clop is added to the list
  const isAtBottom = React.useRef(false)

  // Because the viewableItemsChanged callback won't have access to the updated state, we use a ref to store the
  // total number of clops
  const totalClops = React.useRef(10)

  const [showSpinner, setShowSpinner] = React.useState(false)

  const [clops, setClops] = React.useState(
    Array.from(Array(10).keys()).map(n => ({
      id: generateUniqueKey(),
      text: placeholderClops[n % placeholderClops.length],
    })),
  )

  const addOldClops = () => {
    setClops(prev => {
      const oldClops: ClipClop[] = Array.from(Array(20).keys()).map(n => ({
        id: generateUniqueKey(),
        text:
          placeholderClops[n % placeholderClops.length] + generateUniqueKey(),
      }))

      totalClops.current += oldClops.length
      return prev.concat(oldClops)
    })
  }

  const addNewClop = (clop: string) => {
    setClops(prev => {
      const newClops = Array.from(Array(1).keys())
        .map(() => ({
          id: generateUniqueKey(),
          text: clop,
        }))
        .reverse()

      totalClops.current += newClops.length
      return newClops.concat(prev)
    })
  }

  const [onViewableItemsChanged, viewabilityConfig] = React.useMemo(() => {
    return [
      (info: {viewableItems: Array<ViewToken>; changed: Array<ViewToken>}) => {
        const firstVisibleIndex = info.viewableItems[0]?.index

        isAtBottom.current = Number(firstVisibleIndex) < 2
      },
      {
        itemVisiblePercentThreshold: 100,
        minimumViewTime: 100,
      },
    ]
  }, [])

  const onContentSizeChange = React.useCallback(() => {
    if (isAtBottom.current) {
      flatListRef.current?.scrollToOffset({offset: 0, animated: true})
    }

    isFetching.current = false
    setShowSpinner(false)
  }, [])

  const onEndReached = React.useCallback(() => {
    if (isFetching.current) return
    isFetching.current = true
    setShowSpinner(true)

    // We wouldn't actually use a timeout, but there would be a delay while loading
    setTimeout(() => {
      addOldClops()
    }, 1000)
  }, [])

  return (
    <View style={{flex: 1, marginBottom: 85}}>
      <FlatList
        data={clops}
        keyExtractor={item => item.id}
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
        }}
        renderItem={renderItem}
        contentContainerStyle={{paddingHorizontal: 10}}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        inverted={true}
        onEndReached={onEndReached}
        onScrollToIndexFailed={onScrollToEndFailed}
        onContentSizeChange={onContentSizeChange}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListFooterComponent={<MaybeLoader isLoading={showSpinner} />}
        removeClippedSubviews
        ref={flatListRef}
      />
      <View style={{paddingHorizontal: 10}}>
        <ClopInput onSendClop={addNewClop} />
      </View>
    </View>
  )
}

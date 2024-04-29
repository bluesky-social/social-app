import React from 'react'
import {FlatList, View, ViewToken} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'

import {isWeb} from 'platform/detection'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageItem} from '#/screens/Messages/Conversation/MessageItem'
import {Message} from '#/screens/Messages/Conversation/RandomClipClops'
import {
  useChat,
  useChatLogQuery,
  useSendMessageMutation,
} from '#/screens/Messages/Temp/query/query'
import {Loader} from '#/components/Loader'

const CHAT_ID = '3kqzb4mytxk2v'

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

function renderItem({item}: {item: Message}) {
  return <MessageItem item={item} />
}

// Generate unique key list item.
const generateUniqueKey = () => `_${Math.random().toString(36).substr(2, 9)}`

function onScrollToEndFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export const MessagesList = () => {
  const flatListRef = React.useRef<FlatList>(null)

  // Whenever we reach the end (visually the top), we don't want to keep calling it. We will set `isFetching` to true
  // once the request for new posts starts. Then, we will change it back to false after the content size changes.
  const isFetching = React.useRef(false)

  // We use this to know if we should scroll after a new clop is added to the list
  const isAtBottom = React.useRef(false)

  // Because the viewableItemsChanged callback won't have access to the updated state, we use a ref to store the
  // total number of clops
  const totalMessages = React.useRef(10)

  // @ts-ignore TODO later
  const [_, setShowSpinner] = React.useState(false)

  // Query Data
  const {data: chat} = useChat(CHAT_ID)
  const {mutate: sendMessage} = useSendMessageMutation(CHAT_ID)
  useChatLogQuery()

  React.useEffect(() => {
    totalMessages.current = chat?.messages.length ?? 0
  }, [chat])

  const [onViewableItemsChanged, viewabilityConfig] = React.useMemo(() => {
    return [
      (info: {viewableItems: Array<ViewToken>; changed: Array<ViewToken>}) => {
        const firstVisibleIndex = info.viewableItems[0]?.index

        isAtBottom.current = Number(firstVisibleIndex) < 2
      },
      {
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 10,
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

    // Eventually we will add more here when we hit the top through RQuery
    // We wouldn't actually use a timeout, but there would be a delay while loading
    setTimeout(() => {
      // Do something
      setShowSpinner(false)
    }, 1000)
  }, [])

  const onInputFocus = React.useCallback(() => {
    if (!isAtBottom.current) {
      flatListRef.current?.scrollToOffset({offset: 0, animated: true})
    }
  }, [])

  const onSendMessage = React.useCallback(
    async (message: string) => {
      if (!message) return

      try {
        sendMessage({
          message,
          tempId: generateUniqueKey(),
        })
      } catch (e: any) {
        console.log(e)
      }
    },
    [sendMessage],
  )

  const onInputBlur = React.useCallback(() => {}, [])

  return (
    <KeyboardAvoidingView
      style={{flex: 1, marginBottom: isWeb ? 20 : 85}}
      behavior="padding"
      keyboardVerticalOffset={70}
      contentContainerStyle={{flex: 1}}>
      <FlatList
        data={chat?.messages}
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
        ListFooterComponent={<MaybeLoader isLoading={false} />}
        removeClippedSubviews
        ref={flatListRef}
        keyboardDismissMode="none"
      />
      <View style={{paddingHorizontal: 10}}>
        <MessageInput
          onSendMessage={onSendMessage}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

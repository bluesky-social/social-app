import React, {useCallback, useMemo, useRef, useState} from 'react'
import {FlatList, View, ViewToken} from 'react-native'
import {Alert} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'

import {isWeb} from '#/platform/detection'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageItem} from '#/screens/Messages/Conversation/MessageItem'
import {
  useChat,
  useChatLogQuery,
  useSendMessageMutation,
} from '#/screens/Messages/Temp/query/query'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import * as TempDmChatDefs from '#/temp/dm/defs'

type MessageWithNext = {
  message: TempDmChatDefs.MessageView | TempDmChatDefs.DeletedMessage
  next: TempDmChatDefs.MessageView | TempDmChatDefs.DeletedMessage | null
}

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

function renderItem({item}: {item: MessageWithNext}) {
  if (TempDmChatDefs.isMessageView(item.message))
    return <MessageItem item={item.message} next={item.next} />

  if (TempDmChatDefs.isDeletedMessage(item)) return <Text>Deleted message</Text>

  return null
}

// TODO rm
// TEMP: This is a temporary function to generate unique keys for mutation placeholders
const generateUniqueKey = () => `_${Math.random().toString(36).substr(2, 9)}`

function onScrollToEndFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export function MessagesList({chatId}: {chatId: string}) {
  const flatListRef = useRef<FlatList>(null)

  // Whenever we reach the end (visually the top), we don't want to keep calling it. We will set `isFetching` to true
  // once the request for new posts starts. Then, we will change it back to false after the content size changes.
  const isFetching = useRef(false)

  // We use this to know if we should scroll after a new clop is added to the list
  const isAtBottom = useRef(false)

  // Because the viewableItemsChanged callback won't have access to the updated state, we use a ref to store the
  // total number of clops
  // TODO this needs to be set to whatever the initial number of messages is
  const totalMessages = useRef(10)

  // TODO later

  const [_, setShowSpinner] = useState(false)

  // Query Data
  const {data: chat} = useChat(chatId)
  const {mutate: sendMessage} = useSendMessageMutation(chatId)
  useChatLogQuery()

  const [onViewableItemsChanged, viewabilityConfig] = useMemo(() => {
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

  const onContentSizeChange = useCallback(() => {
    if (isAtBottom.current) {
      flatListRef.current?.scrollToOffset({offset: 0, animated: true})
    }

    isFetching.current = false
    setShowSpinner(false)
  }, [])

  const onEndReached = useCallback(() => {
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

  const onInputFocus = useCallback(() => {
    if (!isAtBottom.current) {
      flatListRef.current?.scrollToOffset({offset: 0, animated: true})
    }
  }, [])

  const onSendMessage = useCallback(
    async (message: string) => {
      if (!message) return

      try {
        sendMessage({
          message,
          tempId: generateUniqueKey(),
        })
      } catch (e: any) {
        Alert.alert(e.toString())
      }
    },
    [sendMessage],
  )

  const onInputBlur = useCallback(() => {}, [])

  const messages = useMemo(() => {
    if (!chat) return []

    const filtered = chat.messages
      .filter(
        (
          message,
        ): message is
          | TempDmChatDefs.MessageView
          | TempDmChatDefs.DeletedMessage => {
          return (
            TempDmChatDefs.isMessageView(message) ||
            TempDmChatDefs.isDeletedMessage(message)
          )
        },
      )
      .reduce((acc, message) => {
        // convert [n1, n2, n3, ...] to [{message: n1, next: n2}, {message: n2, next: n3}, {message: n3, next: n4}, ...]

        return [...acc, {message, next: acc.at(-1)?.message ?? null}]
      }, [] as MessageWithNext[])
    totalMessages.current = filtered.length

    return filtered
  }, [chat])

  return (
    <KeyboardAvoidingView
      style={{flex: 1, marginBottom: isWeb ? 20 : 85}}
      behavior="padding"
      keyboardVerticalOffset={70}
      contentContainerStyle={{flex: 1}}>
      <FlatList
        data={messages}
        keyExtractor={item => item.message.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingHorizontal: 10}}
        inverted={true}
        // In the future, we might want to adjust this value. Not very concerning right now as long as we are only
        // dealing with text. But whenever we have images or other media and things are taller, we will want to lower
        // this...probably.
        initialNumToRender={20}
        // Same with the max to render per batch. Let's be safe for now though.
        maxToRenderPerBatch={25}
        removeClippedSubviews={true}
        onEndReached={onEndReached}
        onScrollToIndexFailed={onScrollToEndFailed}
        onContentSizeChange={onContentSizeChange}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
        }}
        ListFooterComponent={<MaybeLoader isLoading={false} />}
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

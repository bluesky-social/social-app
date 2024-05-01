import React, {useCallback, useMemo, useRef} from 'react'
import {FlatList, View, ViewToken} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'

import {useChat} from '#/state/messages'
import {ChatProvider} from '#/state/messages'
import {ConvoItem, ConvoStatus} from '#/state/messages/convo'
import {isWeb} from 'platform/detection'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageItem} from '#/screens/Messages/Conversation/MessageItem'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

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

function renderItem({item}: {item: ConvoItem}) {
  if (item.type === 'message') {
    return <MessageItem item={item.message} next={item.nextMessage} />
  } else if (item.type === 'deleted-message') {
    return <Text>Deleted message</Text>
  } else if (item.type === 'pending-message') {
    return <Text>{item.message.text}</Text>
  }

  return null
}

function onScrollToEndFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export function MessagesList({convoId}: {convoId: string}) {
  return (
    <ChatProvider convoId={convoId}>
      <MessagesListInner />
    </ChatProvider>
  )
}

export function MessagesListInner() {
  const chat = useChat()
  const flatListRef = useRef<FlatList>(null)
  // We use this to know if we should scroll after a new clop is added to the list
  const isAtBottom = useRef(false)

  // Because the viewableItemsChanged callback won't have access to the updated state, we use a ref to store the
  // total number of clops
  // TODO this needs to be set to whatever the initial number of messages is
  // const totalMessages = useRef(10)

  // TODO later

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
  }, [])

  const onEndReached = useCallback(() => {
    chat.service.fetchMessageHistory()
  }, [chat])

  const onInputFocus = useCallback(() => {
    if (!isAtBottom.current) {
      flatListRef.current?.scrollToOffset({offset: 0, animated: true})
    }
  }, [])

  const onInputBlur = useCallback(() => {}, [])

  return (
    <KeyboardAvoidingView
      style={{flex: 1, marginBottom: isWeb ? 20 : 85}}
      behavior="padding"
      keyboardVerticalOffset={70}
      contentContainerStyle={{flex: 1}}>
      {chat.state.status === ConvoStatus.Ready && (
        <FlatList
          data={chat.state.items}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={{paddingHorizontal: 10}}
          // In the future, we might want to adjust this value. Not very concerning right now as long as we are only
          // dealing with text. But whenever we have images or other media and things are taller, we will want to lower
          // this...probably.
          initialNumToRender={20}
          // Same with the max to render per batch. Let's be safe for now though.
          maxToRenderPerBatch={25}
          inverted={true}
          onEndReached={onEndReached}
          onScrollToIndexFailed={onScrollToEndFailed}
          onContentSizeChange={onContentSizeChange}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          ListFooterComponent={
            <MaybeLoader isLoading={chat.state.isFetchingHistory} />
          }
          removeClippedSubviews={true}
          ref={flatListRef}
          keyboardDismissMode="none"
        />
      )}

      <View style={{paddingHorizontal: 10}}>
        <MessageInput
          onSendMessage={text => {
            chat.service.sendMessage({
              text,
            })
          }}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

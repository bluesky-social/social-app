import React, {useCallback, useMemo, useRef} from 'react'
import {FlatList, View, ViewToken} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'

import {useChat} from '#/state/messages'
import {ConvoItem, ConvoStatus} from '#/state/messages/convo'
import {isWeb} from 'platform/detection'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageItem} from '#/screens/Messages/Conversation/MessageItem'
import {Button, ButtonText} from '#/components/Button'
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
  if (item.type === 'message' || item.type === 'pending-message') {
    return <MessageItem item={item.message} next={item.nextMessage} />
  } else if (item.type === 'deleted-message') {
    return <Text>Deleted message</Text>
  } else if (item.type === 'pending-retry') {
    return (
      <View>
        <Button label="Retry" onPress={item.retry}>
          <ButtonText>Retry</ButtonText>
        </Button>
      </View>
    )
  }

  return null
}

function keyExtractor(item: ConvoItem) {
  return item.key
}

function onScrollToEndFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export function MessagesList() {
  const chat = useChat()
  const flatListRef = useRef<FlatList>(null)
  // We use this to know if we should scroll after a new clop is added to the list
  const isAtBottom = useRef(false)

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

  const onSendMessage = useCallback(
    (text: string) => {
      chat.service.sendMessage({
        text,
      })
    },
    [chat.service],
  )

  return (
    <KeyboardAvoidingView
      style={{flex: 1, marginBottom: isWeb ? 20 : 85}}
      behavior="padding"
      keyboardVerticalOffset={70}
      contentContainerStyle={{flex: 1}}>
      <FlatList
        data={
          chat.state.status === ConvoStatus.Ready ? chat.state.items : undefined
        }
        keyExtractor={keyExtractor}
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
          minIndexForVisible: 1,
        }}
        ListFooterComponent={
          <MaybeLoader
            isLoading={
              chat.state.status === ConvoStatus.Ready &&
              chat.state.isFetchingHistory
            }
          />
        }
        removeClippedSubviews={true}
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

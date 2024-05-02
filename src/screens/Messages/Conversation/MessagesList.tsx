import React, {useCallback, useRef} from 'react'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {isIOS} from '#/platform/detection'
import {useChat} from '#/state/messages'
import {ConvoItem, ConvoStatus} from '#/state/messages/convo'
import {useSetMinimalShellMode} from '#/state/shell'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageItem} from '#/screens/Messages/Conversation/MessageItem'
import {atoms as a} from '#/alf'
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

function RetryButton({onPress}: {onPress: () => unknown}) {
  const {_} = useLingui()

  return (
    <View style={{alignItems: 'center'}}>
      <Button
        label={_(msg`Press to Retry`)}
        onPress={onPress}
        variant="ghost"
        color="negative"
        size="small">
        <ButtonText>
          <Trans>Press to Retry</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

function renderItem({item}: {item: ConvoItem}) {
  if (item.type === 'message' || item.type === 'pending-message') {
    return <MessageItem item={item.message} next={item.nextMessage} />
  } else if (item.type === 'deleted-message') {
    return <Text>Deleted message</Text>
  } else if (item.type === 'pending-retry') {
    return <RetryButton onPress={item.retry} />
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
  const currentOffset = React.useRef(0)

  const onContentSizeChange = useCallback(() => {
    if (currentOffset.current <= 100) {
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

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentOffset.current = e.nativeEvent.contentOffset.y
    },
    [],
  )

  const setMinShellMode = useSetMinimalShellMode()
  useFocusEffect(
    useCallback(() => {
      setMinShellMode(true)
      return () => setMinShellMode(false)
    }, [setMinShellMode]),
  )

  const {bottom: bottomInset} = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      style={[a.flex_1, {marginBottom: bottomInset}]}
      keyboardVerticalOffset={isIOS ? 60 : 25}
      behavior="padding"
      contentContainerStyle={a.flex_1}>
      <FlatList
        ref={flatListRef}
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
        onScroll={onScroll}
        // We don't really need to call this much since there are not any animations that rely on this
        scrollEventThrottle={100}
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
        keyboardDismissMode="on-drag"
      />
      <MessageInput
        onSendMessage={onSendMessage}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
      />
    </KeyboardAvoidingView>
  )
}

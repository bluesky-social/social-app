import React, {useCallback, useEffect, useRef} from 'react'
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useChat} from '#/state/messages'
import {ConvoItem, ConvoStatus} from '#/state/messages/convo'
import {useSetMinimalShellMode} from '#/state/shell'
import {isNative, isWeb} from 'platform/detection'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {useScrollToEndOnFocus} from '#/screens/Messages/Conversation/useScrollToEndOnFocus'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {MessageItem} from '#/components/dms/MessageItem'
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

function onScrollToIndexFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export function MessagesList() {
  const chat = useChat()
  const flatListRef = useRef<FlatList>(null)
  const isAtBottom = React.useRef(true)

  useScrollToEndOnFocus(flatListRef)

  const onContentSizeChange = useCallback((_: number, height: number) => {
    if (!isAtBottom.current) return
    flatListRef.current?.scrollToOffset({animated: isNative, offset: height})
  }, [])

  const onStartReached = useCallback(() => {
    if (chat.status === ConvoStatus.Ready) {
      chat.fetchMessageHistory()
    }
  }, [chat])

  const onSendMessage = useCallback(
    (text: string) => {
      if (chat.status === ConvoStatus.Ready) {
        chat.sendMessage({
          text,
        })
      }
    },
    [chat],
  )

  const onScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const bottomOffset =
        e.nativeEvent.contentOffset.y + e.nativeEvent.layoutMeasurement.height

      isAtBottom.current = e.nativeEvent.contentSize.height - 100 < bottomOffset
    },
    [],
  )

  const onInputFocus = React.useCallback(() => {
    flatListRef.current?.scrollToEnd({animated: true})
  }, [flatListRef])

  const setMinShellMode = useSetMinimalShellMode()
  useFocusEffect(
    useCallback(() => {
      setMinShellMode(true)
      return () => setMinShellMode(false)
    }, [setMinShellMode]),
  )

  const {bottom: bottomInset} = useSafeAreaInsets()
  const keyboardVerticalOffset = useKeyboardVerticalOffset()

  console.log(chat.items)

  return (
    <KeyboardAvoidingView
      style={[a.flex_1, {marginBottom: bottomInset}]}
      keyboardVerticalOffset={keyboardVerticalOffset}
      behavior="padding"
      contentContainerStyle={a.flex_1}>
      <FlatList
        ref={flatListRef}
        data={chat.status === ConvoStatus.Ready ? chat.items : undefined}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{paddingHorizontal: 10}}
        // In the future, we might want to adjust this value. Not very concerning right now as long as we are only
        // dealing with text. But whenever we have images or other media and things are taller, we will want to lower
        // this...probably.
        initialNumToRender={25}
        // Same with the max to render per batch. Let's be safe for now though.
        maxToRenderPerBatch={25}
        removeClippedSubviews={false}
        keyboardDismissMode="on-drag"
        disableVirtualization={true}
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
        }}
        onContentSizeChange={onContentSizeChange}
        onStartReached={onStartReached}
        onScrollToIndexFailed={onScrollToIndexFailed}
        onScroll={onScroll}
        // We don't really need to call this much since there are not any animations that rely on this
        scrollEventThrottle={100}
        ListHeaderComponent={
          <MaybeLoader
            isLoading={
              chat.status === ConvoStatus.Ready && chat.isFetchingHistory
            }
          />
        }
      />
      <MessageInput
        onSendMessage={onSendMessage}
        onFocus={isWeb ? onInputFocus : undefined}
      />
    </KeyboardAvoidingView>
  )
}

function useKeyboardVerticalOffset() {
  const {top: topInset} = useSafeAreaInsets()
  const [screenWindowDifference, setScreenWindowDifference] = React.useState(
    () => Dimensions.get('screen').height - Dimensions.get('window').height,
  )

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({screen, window}) => {
        setScreenWindowDifference(screen.height - window.height)
      },
    )
    return () => subscription.remove()
  }, [])

  return Platform.select({
    ios: topInset,
    android: screenWindowDifference,
    default: 0,
  })
}

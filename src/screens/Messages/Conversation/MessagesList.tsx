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
import {isWeb} from 'platform/detection'
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

  // We need to keep track of when the scroll offset is at the bottom of the list to know when to scroll as new items
  // are added to the list. For example, if the user is scrolled up to 1iew older messages, we don't want to scroll to
  // the bottom.
  const isAtBottom = React.useRef(true)

  // Whenever we first add items to the list, we need to scroll to the end of the list immediately. However, we don't
  // want this to fire multiple times. This also keeps track of whether we should actually try to append items to
  // the top of the list through `onStartReached`.
  const shouldFetchOnStartReached = React.useRef(false)

  // contentOpacity is a web-only hack. There is a slight delay between the rendering of the items and the user being
  // scrolled to the bottom of the view. If we don't hide the items, there's a jarring flash whenever the scroll
  // happens. Therefore, let's not show the items until that first scroll has actually happened
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = React.useState(isWeb)

  // Used to keep track of the current content height. We'll need this in `onScroll` so we know when to start allowing
  // onStartReached to fire.
  const contentHeight = React.useRef(0)

  useScrollToEndOnFocus(flatListRef)

  const onContentSizeChange = useCallback(
    (_: number, height: number) => {
      contentHeight.current = height

      // This number _must_ be the height of the MaybeLoader component
      if (height <= 50 || !isAtBottom.current) {
        return
      }

      flatListRef.current?.scrollToOffset({
        animated: hasInitiallyScrolled,
        offset: height,
      })
    },
    [hasInitiallyScrolled],
  )

  const onStartReached = useCallback(() => {
    if (
      chat.status === ConvoStatus.Ready &&
      shouldFetchOnStartReached.current
    ) {
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

      if (contentHeight.current > 50 && hasInitiallyScrolled) {
        setHasInitiallyScrolled(true)
      }

      if (isAtBottom.current && !shouldFetchOnStartReached.current) {
        shouldFetchOnStartReached.current = true
      }
    },
    [hasInitiallyScrolled],
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
        contentContainerStyle={{
          paddingHorizontal: 10,
          opacity: hasInitiallyScrolled ? 1 : 0,
        }}
        initialNumToRender={isWeb ? 50 : 25}
        maxToRenderPerBatch={isWeb ? 50 : 25}
        removeClippedSubviews={false}
        disableVirtualization={true}
        keyboardDismissMode="on-drag"
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
        }}
        onContentSizeChange={onContentSizeChange}
        onStartReached={onStartReached}
        onScrollToIndexFailed={onScrollToIndexFailed}
        onScroll={onScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={hasInitiallyScrolled}
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

import React, {useCallback, useRef} from 'react'
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native'
import {KeyboardAvoidingView} from 'react-native-keyboard-controller'
import {runOnJS, useSharedValue} from 'react-native-reanimated'
import {ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/reanimated2/hook/commonTypes'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useChat} from '#/state/messages'
import {ConvoItem, ConvoStatus} from '#/state/messages/convo'
import {useSetMinimalShellMode} from '#/state/shell'
import {useAnimatedScrollHandler} from 'lib/hooks/useAnimatedScrollHandler_FIXED'
import {ScrollProvider, useScrollHandlers} from 'lib/ScrollContext'
import {isWeb} from 'platform/detection'
import {List} from 'view/com/util/List'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageListError} from '#/screens/Messages/Conversation/MessageListError'
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
  } else if (item.type === 'error-recoverable') {
    return <MessageListError item={item} />
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
  const isAtBottom = useSharedValue(true)

  // contentOpacity is a web-only hack. There is a slight delay between the rendering of the items and the user being
  // scrolled to the bottom of the view. If we don't hide the items, there's a jarring flash whenever the scroll
  // happens. Therefore, let's not show the items until that first scroll has actually happened
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = React.useState(false)

  // Used to keep track of the current content height. We'll need this in `onScroll` so we know when to start allowing
  // onStartReached to fire.
  const contentHeight = useSharedValue(0)

  const isPrepending = React.useRef(false)

  // This is only used on native because `Keyboard` can't be imported on web. On web, an input focus will immediately
  // trigger scrolling to the bottom. On native however, we need to wait for the keyboard to present before scrolling,
  // which is what this hook listens for
  useScrollToEndOnFocus(flatListRef)

  const setMinShellMode = useSetMinimalShellMode()
  useFocusEffect(
    useCallback(() => {
      setMinShellMode(true)
      return () => setMinShellMode(false)
    }, [setMinShellMode]),
  )

  const onContentSizeChange = useCallback(
    (_: number, height: number) => {
      console.log(height)
      // if (isWeb && !isAtBottom.value) {
      //   flatListRef.current?.scrollToOffset({
      //     animated: false,
      //     offset: height - contentHeight.value,
      //   })
      //   contentHeight.value = height
      //   return
      // }
      //
      // contentHeight.value = height

      // This number _must_ be the height of the MaybeLoader component
      if (height <= 50 || !isAtBottom.value) {
        return
      }

      flatListRef.current?.scrollToOffset({
        animated: hasInitiallyScrolled,
        offset: height,
      })
    },
    [hasInitiallyScrolled, isAtBottom.value],
  )

  const onStartReached = useCallback(() => {
    if (isPrepending.current) {
      return
    }

    isPrepending.current = true

    if (chat.status === ConvoStatus.Ready && hasInitiallyScrolled) {
      chat.fetchMessageHistory()
    }

    // TODO hack, can we await `fetchMessageHistory`?
    setTimeout(() => {
      isPrepending.current = false
    }, 2000)
  }, [chat, hasInitiallyScrolled])

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
    (e: ReanimatedScrollEvent) => {
      'worklet'
      console.log('test')
      const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height

      // Most apps have a little bit of space the user can scroll past while still automatically scrolling ot the bottom
      // when a new message is added, hence the 100 pixel offset
      isAtBottom.value = e.contentSize.height - 100 < bottomOffset

      // This number _must_ be the height of the MaybeLoader component.
      // We don't check for zero, because the `MaybeLoader` component is always present, even when not visible, which
      // adds a 50 pixel offset.
      if (contentHeight.value > 50 && !hasInitiallyScrolled) {
        runOnJS(setHasInitiallyScrolled)(true)
      }
    },
    [contentHeight.value, hasInitiallyScrolled, isAtBottom],
  )

  const onInputFocus = React.useCallback(() => {
    flatListRef.current?.scrollToEnd({animated: true})
  }, [flatListRef])

  const {bottom: bottomInset} = useSafeAreaInsets()
  const keyboardVerticalOffset = useKeyboardVerticalOffset()

  return (
    <KeyboardAvoidingView
      style={[a.flex_1, {marginBottom: bottomInset}]}
      keyboardVerticalOffset={keyboardVerticalOffset}
      behavior="padding"
      contentContainerStyle={a.flex_1}>
      {/* @ts-expect-error web only */}
      <View style={[{flex: 1}, isWeb && {'overflow-y': 'scroll'}]}>
        <ScrollProvider onScroll={onScroll}>
          <List
            ref={flatListRef}
            data={chat.status === ConvoStatus.Ready ? chat.items : undefined}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            disableVirtualization={true}
            initialNumToRender={isWeb ? 100 : 25}
            maxToRenderPerBatch={isWeb ? 100 : 25}
            keyboardDismissMode="on-drag"
            maintainVisibleContentPosition={{
              minIndexForVisible: 1,
            }}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={hasInitiallyScrolled}
            onContentSizeChange={onContentSizeChange}
            onStartReached={onStartReached}
            onScrollToIndexFailed={onScrollToIndexFailed}
            scrollEventThrottle={100}
            ListHeaderComponent={
              <MaybeLoader
                isLoading={
                  chat.status === ConvoStatus.Ready && chat.isFetchingHistory
                }
              />
            }
          />
        </ScrollProvider>
      </View>
      <MessageInput
        onSendMessage={onSendMessage}
        onFocus={isWeb ? onInputFocus : undefined}
      />
    </KeyboardAvoidingView>
  )
}

function useKeyboardVerticalOffset() {
  const {top: topInset} = useSafeAreaInsets()

  return Platform.select({
    ios: topInset,
    // I thought this might be the navigation bar height, but not sure
    // 25 is just trial and error
    android: 25,
    default: 0,
  })
}

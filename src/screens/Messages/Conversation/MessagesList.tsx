import React, {useCallback, useRef} from 'react'
import {FlatList, View} from 'react-native'
import {
  KeyboardAvoidingView,
  useKeyboardHandler,
} from 'react-native-keyboard-controller'
import {runOnJS, useSharedValue} from 'react-native-reanimated'
import {ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/reanimated2/hook/commonTypes'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isIOS} from '#/platform/detection'
import {useChat} from '#/state/messages'
import {ConvoItem, ConvoStatus} from '#/state/messages/convo'
import {ScrollProvider} from 'lib/ScrollContext'
import {isWeb} from 'platform/detection'
import {List} from 'view/com/util/List'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageListError} from '#/screens/Messages/Conversation/MessageListError'
import {atoms as a, useBreakpoints} from '#/alf'
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
    return (
      <MessageItem
        item={item.message}
        next={item.nextMessage}
        pending={item.type === 'pending-message'}
      />
    )
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

  // This will be used on web to assist in determing if we need to maintain the content offset
  const isAtTop = useSharedValue(true)

  // Used to keep track of the current content height. We'll need this in `onScroll` so we know when to start allowing
  // onStartReached to fire.
  const contentHeight = useSharedValue(0)

  // We don't want to call `scrollToEnd` again if we are already scolling to the end, because this creates a bit of jank
  // Instead, we use `onMomentumScrollEnd` and this value to determine if we need to start scrolling or not.
  const isMomentumScrolling = useSharedValue(false)

  const [hasInitiallyScrolled, setHasInitiallyScrolled] = React.useState(false)

  // Every time the content size changes, that means one of two things is happening:
  // 1. New messages are being added from the log or from a message you have sent
  // 2. Old messages are being prepended to the top
  //
  // The first time that the content size changes is when the initial items are rendered. Because we cannot rely on
  // `initialScrollIndex`, we need to immediately scroll to the bottom of the list. That scroll will not be animated.
  //
  // Subsequent resizes will only scroll to the bottom if the user is at the bottom of the list (within 100 pixels of
  // the bottom). Therefore, any new messages that come in or are sent will result in an animated scroll to end. However
  // we will not scroll whenever new items get prepended to the top.
  const onContentSizeChange = useCallback(
    (_: number, height: number) => {
      // Because web does not have `maintainVisibleContentPosition` support, we will need to manually scroll to the
      // previous offset whenever we add new content to the previous offset whenever we add new content to the list.
      if (isWeb && isAtTop.value && hasInitiallyScrolled) {
        flatListRef.current?.scrollToOffset({
          animated: false,
          offset: height - contentHeight.value,
        })
      }

      contentHeight.value = height

      // This number _must_ be the height of the MaybeLoader component
      if (height <= 50 || !isAtBottom.value) {
        return
      }

      flatListRef.current?.scrollToOffset({
        animated: hasInitiallyScrolled,
        offset: height,
      })
      isMomentumScrolling.value = true
    },
    [
      contentHeight,
      hasInitiallyScrolled,
      isAtBottom.value,
      isAtTop.value,
      isMomentumScrolling,
    ],
  )

  // The check for `hasInitiallyScrolled` prevents an initial fetch on mount. FlatList triggers `onStartReached`
  // immediately on mount, since we are in fact at an offset of zero, so we have to ignore those initial calls.
  const onStartReached = useCallback(() => {
    if (chat.status === ConvoStatus.Ready && hasInitiallyScrolled) {
      chat.fetchMessageHistory()
    }
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
      const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height

      // Most apps have a little bit of space the user can scroll past while still automatically scrolling ot the bottom
      // when a new message is added, hence the 100 pixel offset
      isAtBottom.value = e.contentSize.height - 100 < bottomOffset
      isAtTop.value = e.contentOffset.y <= 1

      // This number _must_ be the height of the MaybeLoader component.
      // We don't check for zero, because the `MaybeLoader` component is always present, even when not visible, which
      // adds a 50 pixel offset.
      if (contentHeight.value > 50 && !hasInitiallyScrolled) {
        runOnJS(setHasInitiallyScrolled)(true)
      }
    },
    [contentHeight.value, hasInitiallyScrolled, isAtBottom, isAtTop],
  )

  const onMomentumEnd = React.useCallback(() => {
    'worklet'
    isMomentumScrolling.value = false
  }, [isMomentumScrolling])

  const scrollToEnd = React.useCallback(() => {
    requestAnimationFrame(() => {
      if (isMomentumScrolling.value) return

      flatListRef.current?.scrollToEnd({animated: true})
      isMomentumScrolling.value = true
    })
  }, [isMomentumScrolling])

  const {bottom: bottomInset, top: topInset} = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const bottomBarHeight = gtMobile ? 0 : isIOS ? 40 : 60

  // This is only used inside the useKeyboardHandler because the worklet won't work with a ref directly.
  const scrollToEndNow = React.useCallback(() => {
    flatListRef.current?.scrollToEnd({animated: false})
  }, [])

  useKeyboardHandler({
    onMove: () => {
      'worklet'
      runOnJS(scrollToEndNow)()
    },
  })

  return (
    <KeyboardAvoidingView
      style={[a.flex_1, {marginBottom: bottomInset + bottomBarHeight}]}
      keyboardVerticalOffset={isIOS ? topInset : 0}
      behavior="padding"
      contentContainerStyle={a.flex_1}>
      {/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
      <ScrollProvider onScroll={onScroll} onMomentumEnd={onMomentumEnd}>
        <List
          ref={flatListRef}
          data={chat.items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          disableVirtualization={true}
          initialNumToRender={isWeb ? 50 : 25}
          maxToRenderPerBatch={isWeb ? 50 : 25}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
          }}
          containWeb={true}
          contentContainerStyle={{paddingHorizontal: 10}}
          removeClippedSubviews={false}
          onContentSizeChange={onContentSizeChange}
          onStartReached={onStartReached}
          onScrollToIndexFailed={onScrollToIndexFailed}
          scrollEventThrottle={100}
          ListHeaderComponent={
            <MaybeLoader isLoading={chat.isFetchingHistory} />
          }
        />
      </ScrollProvider>
      <MessageInput onSendMessage={onSendMessage} scrollToEnd={scrollToEnd} />
    </KeyboardAvoidingView>
  )
}

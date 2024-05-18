import React, {useCallback, useRef} from 'react'
import {FlatList, View} from 'react-native'
import Animated, {
  dispatchCommand,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/reanimated2/hook/commonTypes'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {AppBskyRichtextFacet, RichText} from '@atproto/api'

import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {isIOS, isNative} from '#/platform/detection'
import {useConvoActive} from '#/state/messages/convo'
import {ConvoItem, ConvoStatus} from '#/state/messages/convo/types'
import {useAgent} from '#/state/session'
import {ScrollProvider} from 'lib/ScrollContext'
import {isWeb} from 'platform/detection'
import {List} from 'view/com/util/List'
import {ChatDisabled} from '#/screens/Messages/Conversation/ChatDisabled'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageListError} from '#/screens/Messages/Conversation/MessageListError'
import {atoms as a} from '#/alf'
import {MessageItem} from '#/components/dms/MessageItem'
import {NewMessagesPill} from '#/components/dms/NewMessagesPill'
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
    return <MessageItem item={item} />
  } else if (item.type === 'deleted-message') {
    return <Text>Deleted message</Text>
  } else if (item.type === 'error') {
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

export function MessagesList({
  hasScrolled,
  setHasScrolled,
  blocked,
  footer,
}: {
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
  blocked?: boolean
  footer?: React.ReactNode
}) {
  const convoState = useConvoActive()
  const {getAgent} = useAgent()

  const flatListRef = useAnimatedRef<FlatList>()

  const [showNewMessagesPill, setShowNewMessagesPill] = React.useState(false)

  // We need to keep track of when the scroll offset is at the bottom of the list to know when to scroll as new items
  // are added to the list. For example, if the user is scrolled up to 1iew older messages, we don't want to scroll to
  // the bottom.
  const isAtBottom = useSharedValue(true)

  // This will be used on web to assist in determining if we need to maintain the content offset
  const isAtTop = useSharedValue(true)

  // Used to keep track of the current content height. We'll need this in `onScroll` so we know when to start allowing
  // onStartReached to fire.
  const prevContentHeight = useRef(0)
  const prevItemCount = useRef(0)

  const keyboardIsAnimating = useSharedValue(false)
  const layoutHeight = useSharedValue(0)

  // -- Scroll handling

  const scrollToSync = useCallback(
    (offset: number) => {
      'worklet'
      // On web we will always use the `scrollToOffset` on the `FlatList` component,
      // since we know it is already sync
      if (isWeb) {
        flatListRef.current?.scrollToOffset({offset, animated: hasScrolled})
      } else {
        scrollTo(flatListRef, 0, offset, hasScrolled)
      }

      if (!hasScrolled && !convoState.isFetchingHistory) {
        runOnJS(setHasScrolled)(true)
      }
    },
    [flatListRef, hasScrolled, convoState.isFetchingHistory, setHasScrolled],
  )

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
      // previous off whenever we add new content to the previous offset whenever we add new content to the list.
      if (isWeb && isAtTop.value && hasScrolled) {
        flatListRef.current?.scrollToOffset({
          offset: height - prevContentHeight.current,
          animated: false,
        })
      }

      // This number _must_ be the height of the MaybeLoader component
      if (height > 50 && isAtBottom.value && !keyboardIsAnimating.value) {
        // If the size of the content is changing by more than the height of the screen, then we should only
        // scroll 1 screen down, and let the user scroll the rest. However, because a single message could be
        // really large - and the normal chat behavior would be to still scroll to the end if it's only one
        // message - we ignore this rule if there's only one additional message
        if (
          hasScrolled &&
          height - prevContentHeight.current > layoutHeight.value - 50 &&
          convoState.items.length - prevItemCount.current > 1
        ) {
          setShowNewMessagesPill(true)
          runOnUI(scrollToSync)(height - layoutHeight.value + 50)
        } else {
          runOnUI(scrollToSync)(height)
        }
      }

      prevContentHeight.current = height
      prevItemCount.current = convoState.items.length
    },
    [
      scrollToSync,
      hasScrolled,
      convoState.items.length,
      // these are stable
      flatListRef,
      isAtTop.value,
      isAtBottom.value,
      keyboardIsAnimating.value,
      layoutHeight.value,
    ],
  )

  const onStartReached = useCallback(() => {
    if (hasScrolled) {
      convoState.fetchMessageHistory()
    }
  }, [convoState, hasScrolled])

  const onScroll = React.useCallback(
    (e: ReanimatedScrollEvent) => {
      'worklet'
      layoutHeight.value = e.layoutMeasurement.height

      const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height

      if (
        showNewMessagesPill &&
        e.contentSize.height - e.layoutMeasurement.height / 3 < bottomOffset
      ) {
        runOnJS(setShowNewMessagesPill)(false)
      }

      // Most apps have a little bit of space the user can scroll past while still automatically scrolling ot the bottom
      // when a new message is added, hence the 100 pixel offset
      isAtBottom.value = e.contentSize.height - 100 < bottomOffset
      isAtTop.value = e.contentOffset.y <= 1
    },
    [layoutHeight, showNewMessagesPill, isAtBottom, isAtTop],
  )

  // -- Keyboard animation handling
  const animatedKeyboard = useAnimatedKeyboard()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const nativeBottomBarHeight = isIOS ? 42 : 60
  const bottomOffset = isWeb ? 0 : bottomInset + nativeBottomBarHeight

  // On web, we don't want to do anything.
  // On native, we want to scroll the list to the bottom every frame that the keyboard is opening. `scrollTo` runs
  // on the UI thread - directly calling `scrollTo` on the underlying native component, so we achieve 60 FPS.
  useAnimatedReaction(
    () => animatedKeyboard.height.value,
    (now, prev) => {
      'worklet'
      // This never applies on web
      if (isWeb) {
        keyboardIsAnimating.value = false
        return
      }

      // We only need to scroll to end while the keyboard is _opening_. During close, the position changes as we
      // "expand" the view.
      if (prev && now > prev) {
        dispatchCommand(flatListRef, 'scrollToEnd', [false])
      }
      keyboardIsAnimating.value = Boolean(prev) && now !== prev
    },
  )

  // This changes the size of the `ListFooterComponent`. Whenever this changes, the content size will change and our
  // `onContentSizeChange` function will handle scrolling to the appropriate offset.
  const animatedStyle = useAnimatedStyle(() => ({
    marginBottom:
      animatedKeyboard.height.value > bottomOffset
        ? animatedKeyboard.height.value
        : bottomOffset,
  }))

  // -- Message sending
  const onSendMessage = useCallback(
    async (text: string) => {
      let rt = new RichText({text}, {cleanNewlines: true})
      await rt.detectFacets(getAgent())
      rt = shortenLinks(rt)

      // filter out any mention facets that didn't map to a user
      rt.facets = rt.facets?.filter(facet => {
        const mention = facet.features.find(feature =>
          AppBskyRichtextFacet.isMention(feature),
        )
        if (mention && !mention.did) {
          return false
        }
        return true
      })

      convoState.sendMessage({
        text: rt.text,
        facets: rt.facets,
      })
    },
    [convoState, getAgent],
  )

  return (
    <Animated.View style={[a.flex_1, animatedStyle]}>
      {/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
      <ScrollProvider onScroll={onScroll}>
        <List
          ref={flatListRef}
          data={convoState.items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          containWeb={true}
          disableVirtualization={true}
          // The extra two items account for the header and the footer components
          initialNumToRender={isNative ? 32 : 62}
          maxToRenderPerBatch={isWeb ? 32 : 62}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
          }}
          removeClippedSubviews={false}
          sideBorders={false}
          onContentSizeChange={onContentSizeChange}
          onStartReached={onStartReached}
          onScrollToIndexFailed={onScrollToIndexFailed}
          scrollEventThrottle={100}
          ListHeaderComponent={
            <MaybeLoader isLoading={convoState.isFetchingHistory} />
          }
        />
      </ScrollProvider>
      {!blocked ? (
        <>
          {convoState.status === ConvoStatus.Disabled ? (
            <ChatDisabled />
          ) : (
            <MessageInput onSendMessage={onSendMessage} />
          )}
        </>
      ) : (
        footer
      )}
      {showNewMessagesPill && <NewMessagesPill />}
    </Animated.View>
  )
}

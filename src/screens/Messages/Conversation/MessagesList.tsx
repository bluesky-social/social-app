import React, {useCallback, useRef} from 'react'
import {FlatList, View} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {ReanimatedScrollEvent} from 'react-native-reanimated/lib/typescript/reanimated2/hook/commonTypes'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {AppBskyRichtextFacet, RichText} from '@atproto/api'

import {shortenLinks} from '#/lib/strings/rich-text-manip'
import {isIOS, isNative} from '#/platform/detection'
import {useConvoActive} from '#/state/messages/convo'
import {ConvoItem} from '#/state/messages/convo/types'
import {useAgent} from '#/state/session'
import {ScrollProvider} from 'lib/ScrollContext'
import {isWeb} from 'platform/detection'
import {List} from 'view/com/util/List'
import {MessageInput} from '#/screens/Messages/Conversation/MessageInput'
import {MessageListError} from '#/screens/Messages/Conversation/MessageListError'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
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

export function MessagesList() {
  const t = useTheme()
  const convo = useConvoActive()
  const {getAgent} = useAgent()
  const flatListRef = useRef<FlatList>(null)

  const [showNewMessagesPill, setShowNewMessagesPill] = React.useState(false)

  // We need to keep track of when the scroll offset is at the bottom of the list to know when to scroll as new items
  // are added to the list. For example, if the user is scrolled up to 1iew older messages, we don't want to scroll to
  // the bottom.
  const isAtBottom = useSharedValue(true)

  // This will be used on web to assist in determing if we need to maintain the content offset
  const isAtTop = useSharedValue(true)

  // Used to keep track of the current content height. We'll need this in `onScroll` so we know when to start allowing
  // onStartReached to fire.
  const contentHeight = useSharedValue(0)
  const prevItemCount = useRef(0)

  // We don't want to call `scrollToEnd` again if we are already scolling to the end, because this creates a bit of jank
  // Instead, we use `onMomentumScrollEnd` and this value to determine if we need to start scrolling or not.
  const isMomentumScrolling = useSharedValue(false)
  const hasInitiallyScrolled = useSharedValue(false)
  const keyboardIsOpening = useSharedValue(false)
  const layoutHeight = useSharedValue(0)

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
      if (isWeb && isAtTop.value && hasInitiallyScrolled.value) {
        flatListRef.current?.scrollToOffset({
          animated: false,
          offset: height - contentHeight.value,
        })
      }

      // This number _must_ be the height of the MaybeLoader component
      if (height > 50 && (isAtBottom.value || keyboardIsOpening.value)) {
        let newOffset = height

        // If the size of the content is changing by more than the height of the screen, then we should only
        // scroll 1 screen down, and let the user scroll the rest. However, because a single message could be
        // really large - and the normal chat behavior would be to still scroll to the end if it's only one
        // message - we ignore this rule if there's only one additional message
        if (
          hasInitiallyScrolled.value &&
          height - contentHeight.value > layoutHeight.value - 50 &&
          convo.items.length - prevItemCount.current > 1
        ) {
          newOffset = contentHeight.value - 50
          setShowNewMessagesPill(true)
        }

        flatListRef.current?.scrollToOffset({
          animated: hasInitiallyScrolled.value && !keyboardIsOpening.value,
          offset: newOffset,
        })
        isMomentumScrolling.value = true
      }
      contentHeight.value = height
      prevItemCount.current = convo.items.length
    },
    [
      contentHeight,
      hasInitiallyScrolled.value,
      isAtBottom.value,
      isAtTop.value,
      isMomentumScrolling,
      layoutHeight.value,
      convo.items.length,
      keyboardIsOpening.value,
    ],
  )

  // The check for `hasInitiallyScrolled` prevents an initial fetch on mount. FlatList triggers `onStartReached`
  // immediately on mount, since we are in fact at an offset of zero, so we have to ignore those initial calls.
  const onStartReached = useCallback(() => {
    if (hasInitiallyScrolled.value) {
      convo.fetchMessageHistory()
    }
  }, [convo, hasInitiallyScrolled])

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

      convo.sendMessage({
        text: rt.text,
        facets: rt.facets,
      })
    },
    [convo, getAgent],
  )

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

      // This number _must_ be the height of the MaybeLoader component.
      // We don't check for zero, because the `MaybeLoader` component is always present, even when not visible, which
      // adds a 50 pixel offset.
      if (contentHeight.value > 50 && !hasInitiallyScrolled.value) {
        hasInitiallyScrolled.value = true
      }
    },
    [
      layoutHeight,
      showNewMessagesPill,
      isAtBottom,
      isAtTop,
      contentHeight.value,
      hasInitiallyScrolled,
    ],
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

  // -- Keyboard animation handling
  const animatedKeyboard = useAnimatedKeyboard()
  const {gtMobile} = useBreakpoints()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const nativeBottomBarHeight = isIOS ? 42 : 60
  const bottomOffset =
    isWeb && gtMobile ? 0 : bottomInset + nativeBottomBarHeight

  // We need to keep track of when the keyboard is animating and when it isn't, since we want our `onContentSizeChanged`
  // callback to animate the scroll _only_ when the keyboard isn't animating. Any time the previous value of kb height
  // is different, we know that it is animating. When it finally settles, now will be equal to prev.
  useAnimatedReaction(
    () => animatedKeyboard.height.value,
    (now, prev) => {
      // This never applies on web
      if (isWeb) {
        keyboardIsOpening.value = false
      } else {
        keyboardIsOpening.value = now !== prev
      }
    },
  )

  // This changes the size of the `ListFooterComponent`. Whenever this changes, the content size will change and our
  // `onContentSizeChange` function will handle scrolling to the appropriate offset.
  const animatedFooterStyle = useAnimatedStyle(() => ({
    marginBottom:
      animatedKeyboard.height.value > bottomOffset
        ? animatedKeyboard.height.value
        : bottomOffset,
  }))

  // At a minimum we want the bottom to be whatever the height of our insets and bottom bar is. If the keyboard's height
  // is greater than that however, we use that value.
  const animatedInputStyle = useAnimatedStyle(() => ({
    bottom:
      animatedKeyboard.height.value > bottomOffset
        ? animatedKeyboard.height.value
        : bottomOffset,
  }))

  return (
    <>
      {/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
      <ScrollProvider onScroll={onScroll} onMomentumEnd={onMomentumEnd}>
        <List
          ref={flatListRef}
          data={convo.items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          containWeb={true}
          contentContainerStyle={[a.px_md]}
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
            <MaybeLoader isLoading={convo.isFetchingHistory} />
          }
          ListFooterComponent={<Animated.View style={[animatedFooterStyle]} />}
        />
      </ScrollProvider>
      {showNewMessagesPill && <NewMessagesPill />}
      <Animated.View style={[a.relative, t.atoms.bg, animatedInputStyle]}>
        <MessageInput onSendMessage={onSendMessage} scrollToEnd={scrollToEnd} />
      </Animated.View>
    </>
  )
}

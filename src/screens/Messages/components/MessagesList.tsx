import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {type ScrollViewProps, View} from 'react-native'
import {KeyboardChatScrollView} from 'react-native-keyboard-controller'
import {
  runOnJS,
  type ScrollEvent,
  type SharedValue,
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ChatBskyConvoDefs} from '@atproto/api'
import {useScrollEdgeEffectRef} from '@bsky.app/expo-scroll-edge-effect'

import {mergeRefs} from '#/lib/merge-refs'
import {ScrollProvider} from '#/lib/ScrollContext'
import {useConvoActive} from '#/state/messages/convo'
import {ConvoStatus} from '#/state/messages/convo/types'
import {List, type ListMethods} from '#/view/com/util/List'
import {MessageListError} from '#/screens/Messages/components/MessageListError'
import {platform, tokens, useTheme, web} from '#/alf'
import {DateDivider} from '#/components/dms/DateDivider'
import {MessageItem} from '#/components/dms/MessageItem'
import {NewMessagesPill} from '#/components/dms/NewMessagesPill'
import {SystemMessageGroup} from '#/components/dms/SystemMessageGroup'
import {SystemMessageItem} from '#/components/dms/SystemMessageItem'
import {
  INITIAL_NUMBER_TO_RENDER,
  MAX_TO_RENDER_PER_BATCH,
} from '#/components/dms/util'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_ANDROID, IS_WEB} from '#/env'
import {groupSystemMessages, type RenderItem} from './groupSystemMessages'
import {MessagesListInfoPanel} from './MessagesListInfoPanel'

/**
 * The static portion of the bottom reservation. Lives inside the scroll
 * view's content via `contentContainerStyle.paddingBottom`.
 */
const LIST_CONTENT_PADDING_BOTTOM = platform({
  ios: tokens.space.lg,
  android: tokens.space.md,
  default: 0, // web uses ListFooterComponent height for the static slot too
})

/**
 * The non-input portion of the dynamic bottom padding, i.e., everything
 * `getChatBottomDynamicPadding` adds on top of `inputHeight`. Split out as a
 * plain JS function so the native path can resolve it on the JS thread (via
 * `platform()`, which is not worklet-safe) and then close over the result
 * when entering `useDerivedValue`.
 */
function getChatBottomDynamicOffset(bottomInset: number): number {
  return platform({
    ios: bottomInset - tokens.space.lg,
    android: bottomInset,
    web: tokens.space.md,
    default: 0,
  })
}

/**
 * The dynamic, composer-height-dependent portion of the bottom reservation.
 *
 * On native this value is fed back into the scroll view. On web it's the height
 * of `ListFooterComponent`. Both paths sit above `LIST_CONTENT_PADDING_BOTTOM`
 * to make up the total reservation.
 */
function getChatBottomDynamicPadding({
  inputHeight,
  bottomInset,
}: {
  inputHeight: number
  bottomInset: number
}): number {
  return inputHeight + getChatBottomDynamicOffset(bottomInset)
}

/**
 * The chat skeleton needs to match this vertical space so the skeleton-to-list
 * handoff doesn't visibly jump.
 *
 * Single source of truth: Every internal call site is derived from
 * `LIST_CONTENT_PADDING_BOTTOM` plus `getChatBottomDynamicPadding`, so they
 * can't drift out of sync.
 */
export function getChatBottomReservation(args: {
  inputHeight: number
  bottomInset: number
}): number {
  return LIST_CONTENT_PADDING_BOTTOM + getChatBottomDynamicPadding(args)
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

function keyExtractor(item: RenderItem) {
  return item.key
}

function getNeighborMessage(
  items: RenderItem[],
  index: number,
): ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView | null {
  const neighbor = items[index]
  if (!neighbor) return null
  if (
    neighbor.type === 'message' ||
    neighbor.type === 'pending-message' ||
    neighbor.type === 'deleted-message'
  ) {
    if (
      ChatBskyConvoDefs.isMessageView(neighbor.message) ||
      ChatBskyConvoDefs.isDeletedMessageView(neighbor.message)
    ) {
      return neighbor.message
    }
  }
  return null
}

function onScrollToIndexFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export function MessagesList({
  hasScrolled,
  setHasScrolled,
  transparentHeaderHeight,
  inputHeightUI,
  inputHeightJS,
}: {
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
  transparentHeaderHeight?: number
  inputHeightUI: SharedValue<number>
  inputHeightJS: number
}) {
  const convoState = useConvoActive()
  const t = useTheme()
  const {bottom: bottomInset} = useSafeAreaInsets()

  const flatListRef = useAnimatedRef<ListMethods>()

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  )
  const onToggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const renderItems = groupSystemMessages(convoState.items)

  const [newMessagesPill, setNewMessagesPill] = useState({
    show: false,
    startContentOffset: 0,
  })

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

  // Tracks whether the initial scroll-to-bottom has been triggered. Separated from isAtBottom so that contentInset
  // (which causes an early onScroll with negative offset) can't prevent the first scroll.
  // Reset when hasScrolled goes back to false (e.g. convo re-initialization after backgrounding).
  const hasInitiallyScrolled = useRef(false)
  const prevHasScrolled = useRef(hasScrolled)
  useLayoutEffect(() => {
    if (prevHasScrolled.current && !hasScrolled) {
      hasInitiallyScrolled.current = false
    }
    prevHasScrolled.current = hasScrolled
  }, [hasScrolled])

  // -- Keep track of background state and positioning for new pill
  const layoutHeight = useSharedValue(0)
  const didBackground = useRef(false)
  useEffect(() => {
    if (convoState.status === ConvoStatus.Backgrounded) {
      didBackground.current = true
    }
  }, [convoState.status])

  // -- Scroll handling

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
      if (IS_WEB && isAtTop.get() && hasScrolled) {
        flatListRef.current?.scrollToOffset({
          offset: height - prevContentHeight.current,
          animated: false,
        })
      }

      // Initial scroll to bottom — unconditional, not gated on isAtBottom. This is separated because contentInset
      // can cause an early onScroll with a negative offset that sets isAtBottom to false before we get here.
      if (!hasInitiallyScrolled.current && renderItems.length > 0) {
        hasInitiallyScrolled.current = true
        flatListRef.current?.scrollToOffset({offset: height, animated: false})
        // If history is already done loading, mark ready after a frame for the scroll to settle.
        // Otherwise, the footer sentinel's onLayout will handle it when history finishes.
        if (!convoState.isFetchingHistory) {
          requestAnimationFrame(() => {
            setHasScrolled(true)
          })
        }
        prevContentHeight.current = height
        prevItemCount.current = renderItems.length
        return
      }

      // Subsequent: auto-scroll only if user is at the bottom
      if (isAtBottom.get()) {
        // If the size of the content is changing by more than the height of the screen, then we don't
        // want to scroll further than the start of all the new content. Since we are storing the previous offset,
        // we can just scroll the user to that offset and add a little bit of padding. We'll also show the pill
        // that can be pressed to immediately scroll to the end.
        if (
          didBackground.current &&
          hasScrolled &&
          height - prevContentHeight.current > layoutHeight.get() - 50 &&
          renderItems.length - prevItemCount.current > 1
        ) {
          flatListRef.current?.scrollToOffset({
            offset: prevContentHeight.current - 65,
            animated: true,
          })
          setNewMessagesPill({
            show: true,
            startContentOffset: prevContentHeight.current - 65,
          })
        } else {
          flatListRef.current?.scrollToOffset({
            offset: height,
            animated: hasScrolled && height > prevContentHeight.current,
          })
        }
      }

      prevContentHeight.current = height
      prevItemCount.current = renderItems.length
      didBackground.current = false
    },
    [
      hasScrolled,
      setHasScrolled,
      convoState.isFetchingHistory,
      renderItems.length,
      flatListRef,
      isAtTop,
      isAtBottom,
      layoutHeight,
    ],
  )

  const onStartReached = useCallback(() => {
    void convoState.fetchMessageHistory()
  }, [convoState])

  const onScroll = useCallback(
    (e: ScrollEvent) => {
      'worklet'
      layoutHeight.set(e.layoutMeasurement.height)
      const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height

      // Most apps have a little bit of space the user can scroll past while still automatically scrolling ot the bottom
      // when a new message is added, hence the 100 pixel offset
      isAtBottom.set(e.contentSize.height - 100 < bottomOffset)
      isAtTop.set(e.contentOffset.y <= 1)

      if (
        newMessagesPill.show &&
        (e.contentOffset.y > newMessagesPill.startContentOffset + 200 ||
          isAtBottom.get())
      ) {
        runOnJS(setNewMessagesPill)({
          show: false,
          startContentOffset: 0,
        })
      }
    },
    [layoutHeight, newMessagesPill, isAtBottom, isAtTop],
  )

  const scrollToEndOnPress = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset: prevContentHeight.current,
      animated: true,
    })
  }, [flatListRef])

  const renderItem = ({item, index}: {item: RenderItem; index: number}) => {
    if (item.type === 'message' || item.type === 'pending-message') {
      return (
        <MessageItem
          item={item}
          isGroupChat={convoState.convo.kind === 'group'}
          prevMessage={getNeighborMessage(renderItems, index - 1)}
          nextMessage={getNeighborMessage(renderItems, index + 1)}
          relatedProfiles={convoState.relatedProfiles}
        />
      )
    } else if (item.type === 'deleted-message') {
      return <Text>Deleted message</Text>
    } else if (item.type === 'system-message') {
      return (
        <SystemMessageItem
          item={item}
          relatedProfiles={convoState.relatedProfiles}
        />
      )
    } else if (item.type === 'system-message-group') {
      return (
        <SystemMessageGroup
          item={item}
          expanded={expandedGroups.has(item.key)}
          onToggle={onToggleGroup}
          relatedProfiles={convoState.relatedProfiles}
        />
      )
    } else if (item.type === 'system-message-date-divider') {
      return <DateDivider date={item.sentAt} />
    } else if (item.type === 'error') {
      return <MessageListError item={item} />
    }

    return null
  }

  // Footer sentinel: when history is still loading during the initial scroll, the footer's onLayout fires each time
  // new items are prepended (shifting its position). Once history finishes, this triggers setHasScrolled.
  const onFooterLayout = useCallback(() => {
    if (
      hasInitiallyScrolled.current &&
      !hasScrolled &&
      !convoState.isFetchingHistory
    ) {
      requestAnimationFrame(() => {
        setHasScrolled(true)
      })
    }
  }, [hasScrolled, setHasScrolled, convoState.isFetchingHistory])

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollComponent
        {...props}
        inputHeight={inputHeightUI}
        attachScrollEdgeEffect={hasScrolled}
      />
    ),
    [inputHeightUI, hasScrolled],
  )

  return (
    <>
      {/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
      <ScrollProvider onScroll={onScroll}>
        <List
          ref={flatListRef}
          data={renderItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          disableFullWindowScroll={true}
          disableVirtualization={true}
          // The extra two items account for the header and the footer components
          initialNumToRender={INITIAL_NUMBER_TO_RENDER}
          maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{minIndexForVisible: 0}}
          removeClippedSubviews={false}
          sideBorders={false}
          onContentSizeChange={onContentSizeChange}
          onStartReached={onStartReached}
          onScrollToIndexFailed={onScrollToIndexFailed}
          showsVerticalScrollIndicator={!IS_ANDROID}
          scrollEventThrottle={100}
          ListHeaderComponent={
            <>
              <MaybeLoader isLoading={convoState.isFetchingHistory} />
              {convoState.convo?.kind === 'group' &&
              convoState.hasAllHistory ? (
                <MessagesListInfoPanel convo={convoState.convo} />
              ) : null}
            </>
          }
          // native only (prop is not supported on web)
          renderScrollComponent={renderScrollComponent}
          contentContainerStyle={{
            paddingBottom: LIST_CONTENT_PADDING_BOTTOM,
          }}
          ListFooterComponent={
            <View
              style={web({
                height: getChatBottomDynamicPadding({
                  inputHeight: inputHeightJS,
                  bottomInset,
                }),
              })}
              onLayout={onFooterLayout}
            />
          }
          style={web({
            scrollbarWidth: 'thin',
            scrollbarColor: `${t.palette.contrast_100} transparent`,
            scrollbarGutter: 'stable both-edges',
          })}
          contentInset={{top: transparentHeaderHeight}}
          scrollIndicatorInsets={{top: transparentHeaderHeight}}
        />
      </ScrollProvider>
      {newMessagesPill.show && <NewMessagesPill onPress={scrollToEndOnPress} />}
    </>
  )
}

/** Note: native only */
function ChatScrollComponent({
  ref,
  inputHeight,
  attachScrollEdgeEffect,
  ...props
}: ScrollViewProps & {
  ref?: React.RefObject<React.ComponentRef<
    typeof KeyboardChatScrollView
  > | null>
  inputHeight: SharedValue<number>
  /**
   * Whether to register this scroll view as the source for the header's top
   * edge-effect blur (Liquid Glass). Held off until after the initial
   * scroll-to-end so the `ChatSkeleton` - which is visually on top and has
   * already registered its own scroll view - stays the active source while
   * it's still on screen. Without this gate, MessagesList would override the
   * skeleton's registration on mount and the header would try to blur an
   * empty, off-screen scroll view.
   */
  attachScrollEdgeEffect: boolean
}) {
  const scrollEdgeRef = useScrollEdgeEffectRef()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const nodeRef =
    useRef<React.ComponentRef<typeof KeyboardChatScrollView>>(null)

  // Resolved on the JS thread; the worklet below just adds inputHeight.
  const inputOffset = getChatBottomDynamicOffset(bottomInset)

  const extraContentPadding = useDerivedValue(
    () => inputHeight.get() + inputOffset,
  )

  useLayoutEffect(() => {
    if (!attachScrollEdgeEffect || !scrollEdgeRef) return
    if (nodeRef.current) {
      scrollEdgeRef(nodeRef.current)
    }
    return () => {
      scrollEdgeRef(null)
    }
  }, [attachScrollEdgeEffect, scrollEdgeRef])

  return (
    <KeyboardChatScrollView
      ref={mergeRefs([nodeRef, ref])}
      automaticallyAdjustContentInsets={false}
      keyboardDismissMode="interactive"
      keyboardLiftBehavior="always"
      extraContentPadding={extraContentPadding}
      // Same value as `extraContentPadding` minus `inputHeight`: this is the
      // vertical gap the keyboard controller needs to account for between the
      // scroll content's bottom and where the input actually sits.
      offset={inputOffset}
      {...props}
    />
  )
}

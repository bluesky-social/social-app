import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {type LayoutChangeEvent, type ScrollViewProps, View} from 'react-native'
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewProps,
  KeyboardGestureArea,
} from 'react-native-keyboard-controller'
import {
  runOnJS,
  type ScrollEvent,
  type SharedValue,
  useAnimatedRef,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  type $Typed,
  type AppBskyEmbedRecord,
  AppBskyRichtextFacet,
  RichText,
} from '@atproto/api'
import {useScrollEdgeEffectRef} from '@bsky.app/expo-scroll-edge-effect'

import {mergeRefs} from '#/lib/merge-refs'
import {ScrollProvider} from '#/lib/ScrollContext'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {
  convertBskyAppUrlIfNeeded,
  isBskyPostUrl,
} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {
  type ActiveConvoStates,
  isConvoActive,
  useConvoActive,
} from '#/state/messages/convo'
import {
  type ConvoItem,
  type ConvoState,
  ConvoStatus,
} from '#/state/messages/convo/types'
import {useGetPost} from '#/state/queries/post'
import {useAgent} from '#/state/session'
import {List, type ListMethods} from '#/view/com/util/List'
import {MessageComposer} from '#/screens/Messages/components/MessageComposer'
import {MessageInput} from '#/screens/Messages/components/MessageInput'
import {MessageListError} from '#/screens/Messages/components/MessageListError'
import {atoms as a, platform, tokens, useTheme, web} from '#/alf'
import {ChatEmptyPill} from '#/components/dms/ChatEmptyPill'
import {DateDividerToggleProvider} from '#/components/dms/DateDividerToggle'
import {MessageItem} from '#/components/dms/MessageItem'
import {NewMessagesPill} from '#/components/dms/NewMessagesPill'
import {SystemMessageItem} from '#/components/dms/SystemMessageItem'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID, IS_NATIVE, IS_WEB} from '#/env'
import {ChatStatusInfo} from './ChatStatusInfo'
import {MessageInputEmbed, useMessageEmbed} from './MessageInputEmbed'
import {MessagesListInfoPanel} from './MessagesListInfoPanel'
import {KeyboardStickyView} from './vendor/KeyboardStickyView'

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

function keyExtractor(item: ConvoItem) {
  return item.key
}

function onScrollToIndexFailed() {
  // Placeholder function. You have to give FlatList something or else it will error.
}

export function MessagesList({
  hasScrolled,
  setHasScrolled,
  footer,
  hasAcceptOverride,
  transparentHeaderHeight,
}: {
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
  footer?: React.ReactNode
  hasAcceptOverride?: boolean
  transparentHeaderHeight?: number
}) {
  const ax = useAnalytics()
  const convoState = useConvoActive()
  const agent = useAgent()
  const getPost = useGetPost()
  const {embedUri, setEmbed} = useMessageEmbed()
  const t = useTheme()

  const textInputId = 'chat-input-' + useId()
  const flatListRef = useAnimatedRef<ListMethods>()

  const [newMessagesPill, setNewMessagesPill] = useState({
    show: false,
    startContentOffset: 0,
  })

  const inputHeightUI = useSharedValue(0)
  const [inputHeightJS, setInputHeightJS] = useState(0)

  const onInputLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const inputHeight = event.nativeEvent.layout.height
      inputHeightUI.set(inputHeight)
      setInputHeightJS(inputHeight)
    },
    [inputHeightUI],
  )

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
      if (!hasInitiallyScrolled.current && convoState.items.length > 0) {
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
        prevItemCount.current = convoState.items.length
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
          convoState.items.length - prevItemCount.current > 1
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
      prevItemCount.current = convoState.items.length
      didBackground.current = false
    },
    [
      hasScrolled,
      setHasScrolled,
      convoState.isFetchingHistory,
      convoState.items.length,
      // these are stable
      flatListRef,
      isAtTop,
      isAtBottom,
      layoutHeight,
    ],
  )

  const onStartReached = useCallback(() => {
    if (hasScrolled && prevContentHeight.current > layoutHeight.get()) {
      void convoState.fetchMessageHistory()
    }
  }, [convoState, hasScrolled, layoutHeight])

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

  // -- Keyboard animation handling

  const {bottom: bottomInset} = useSafeAreaInsets()

  // -- Message sending
  const onSendMessage = useCallback(
    async (text: string) => {
      let rt = new RichText({text: text.trimEnd()}, {cleanNewlines: true})

      // detect facets without resolution first - this is used to see if there's
      // any post links in the text that we can embed. We do this first because
      // we want to remove the post link from the text, re-trim, then detect facets
      rt.detectFacetsWithoutResolution()

      let embed: $Typed<AppBskyEmbedRecord.Main> | undefined

      if (embedUri) {
        try {
          const post = await getPost({uri: embedUri})
          if (post) {
            embed = {
              $type: 'app.bsky.embed.record',
              record: {
                uri: post.uri,
                cid: post.cid,
              },
            }

            // look for the embed uri in the facets, so we can remove it from the text
            const postLinkFacet = rt.facets?.find(facet => {
              return facet.features.find(feature => {
                if (AppBskyRichtextFacet.isLink(feature)) {
                  if (isBskyPostUrl(feature.uri)) {
                    const url = convertBskyAppUrlIfNeeded(feature.uri)
                    const [_0, _1, _2, rkey] = url.split('/').filter(Boolean)

                    // this might have a handle instead of a DID
                    // so just compare the rkey - not particularly dangerous
                    return post.uri.endsWith(rkey)
                  }
                }
                return false
              })
            })

            if (postLinkFacet) {
              const isAtStart = postLinkFacet.index.byteStart === 0
              const isAtEnd =
                postLinkFacet.index.byteEnd === rt.unicodeText.graphemeLength

              // remove the post link from the text
              if (isAtStart || isAtEnd) {
                rt.delete(
                  postLinkFacet.index.byteStart,
                  postLinkFacet.index.byteEnd,
                )
              }

              rt = new RichText({text: rt.text.trim()}, {cleanNewlines: true})
            }
          }
        } catch (error) {
          logger.error('Failed to get post as quote for DM', {error})
        }
      }

      await rt.detectFacets(agent)

      rt = shortenLinks(rt)
      rt = stripInvalidMentions(rt)

      if (!hasScrolled) {
        setHasScrolled(true)
      }

      convoState.sendMessage({
        text: rt.text,
        facets: rt.facets,
        embed,
      })
    },
    [agent, convoState, embedUri, getPost, hasScrolled, setHasScrolled],
  )

  const scrollToEndOnPress = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset: prevContentHeight.current,
      animated: true,
    })
  }, [flatListRef])

  const renderItem = ({item}: {item: ConvoItem}) => {
    if (item.type === 'message' || item.type === 'pending-message') {
      return (
        <MessageItem
          item={item}
          profile={convoState.convo.members.find(
            member => member.did === item.message.sender.did,
          )}
          isGroupChat={convoState.isGroup()}
        />
      )
    } else if (item.type === 'deleted-message') {
      return <Text>Deleted message</Text>
    } else if (item.type === 'system-message') {
      return <SystemMessageItem item={item} />
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
      <ChatScrollComponent {...props} inputHeight={inputHeightUI} />
    ),
    [inputHeightUI],
  )

  return (
    <DateDividerToggleProvider>
      <KeyboardGestureArea
        interpolator="ios"
        // HACKFIX: https://github.com/kirillzyusko/react-native-keyboard-controller/issues/1419
        offset={Math.round(inputHeightJS)}
        // slightly too buggy unfortunately, enable when possible
        // textInputNativeID={textInputId}
        style={[a.flex_1]}>
        {/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
        <ScrollProvider onScroll={onScroll}>
          <List
            ref={flatListRef}
            data={convoState.items}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            disableFullWindowScroll={true}
            disableVirtualization={true}
            // The extra two items account for the header and the footer components
            initialNumToRender={IS_NATIVE ? 32 : 62}
            maxToRenderPerBatch={IS_WEB ? 32 : 62}
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
                {convoState.isGroup() && convoState.hasAllHistory ? (
                  <MessagesListInfoPanel convoState={convoState} />
                ) : null}
              </>
            }
            // native only (prop is not supported on web)
            renderScrollComponent={renderScrollComponent}
            contentContainerStyle={{
              paddingBottom: platform({
                // ios is slightly larger as the input has no top padding
                ios: tokens.space.lg,
                android: tokens.space.md,
                web: 0, // web uses ListFooterComponent instead for scroll reasons
              }),
            }}
            ListFooterComponent={
              <View
                style={web({height: tokens.space.md + inputHeightJS})}
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
        <KeyboardStickyView
          style={[a.absolute, a.bottom_0, a.left_0, a.right_0]}
          onLayout={onInputLayout}
          minimumOffset={bottomInset}
          offset={{
            closed: platform({
              ios: tokens.space.lg, // hide bottom padding when closed
              default: 0,
            }),
            opened: 0,
          }}>
          {footer ?? (
            <ConversationFooter
              convoState={convoState}
              hasAcceptOverride={hasAcceptOverride}>
              {ax.features.enabled(ax.features.DmsNewMessageComposerEnable) ? (
                <MessageComposer
                  textInputId={textInputId}
                  onSendMessage={(message: string) =>
                    void onSendMessage(message)
                  }
                  hasEmbed={!!embedUri}
                  setEmbed={setEmbed}>
                  <MessageInputEmbed embedUri={embedUri} setEmbed={setEmbed} />
                </MessageComposer>
              ) : (
                <MessageInput
                  textInputId={textInputId}
                  onSendMessage={onSendMessage}
                  hasEmbed={!!embedUri}
                  setEmbed={setEmbed}>
                  <MessageInputEmbed embedUri={embedUri} setEmbed={setEmbed} />
                </MessageInput>
              )}
            </ConversationFooter>
          )}
        </KeyboardStickyView>
      </KeyboardGestureArea>

      {newMessagesPill.show && <NewMessagesPill onPress={scrollToEndOnPress} />}
    </DateDividerToggleProvider>
  )
}

/** Note: native only */
function ChatScrollComponent({
  ref,
  inputHeight,
  ...props
}: ScrollViewProps & {
  ref?: React.RefObject<KeyboardChatScrollViewProps>
  inputHeight: SharedValue<number>
}) {
  const scrollEdgeRef = useScrollEdgeEffectRef()
  const {bottom: bottomInset} = useSafeAreaInsets()

  const offset = platform({
    ios: bottomInset - tokens.space.lg,
    android: bottomInset,
    default: 0,
  })

  const inputOffset = platform({
    ios: bottomInset - tokens.space.lg,
    android: bottomInset,
    default: 0,
  })

  const extraContentPadding = useDerivedValue(
    () => inputHeight.get() + inputOffset,
  )

  return (
    <KeyboardChatScrollView
      ref={mergeRefs([scrollEdgeRef, ref])}
      automaticallyAdjustContentInsets={false}
      keyboardDismissMode="interactive"
      keyboardLiftBehavior="always"
      extraContentPadding={extraContentPadding}
      offset={offset}
      {...props}
    />
  )
}

type FooterState = 'loading' | 'new-chat' | 'request' | 'standard'

function getFooterState(
  convoState: ActiveConvoStates,
  hasAcceptOverride?: boolean,
): FooterState {
  if (convoState.items.length === 0) {
    if (convoState.isFetchingHistory) {
      return 'loading'
    } else {
      return 'new-chat'
    }
  }

  if (convoState.convo.status === 'request' && !hasAcceptOverride) {
    return 'request'
  }

  return 'standard'
}

function ConversationFooter({
  convoState,
  hasAcceptOverride,
  children,
}: {
  convoState: ConvoState
  hasAcceptOverride?: boolean
  children?: React.ReactNode // message input
}) {
  if (!isConvoActive(convoState)) {
    return null
  }

  const footerState = getFooterState(convoState, hasAcceptOverride)

  switch (footerState) {
    case 'loading':
      return null
    case 'new-chat':
      return (
        <>
          <ChatEmptyPill />
          {children}
        </>
      )
    case 'request':
      return <ChatStatusInfo convoState={convoState} />
    case 'standard':
      return children
  }
}

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
import Animated, {
  runOnJS,
  type ScrollEvent,
  type SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {
  type $Typed,
  type AppBskyEmbedRecord,
  AppBskyRichtextFacet,
  ChatBskyConvoDefs,
  type ChatBskyEmbedJoinLink,
  RichText,
} from '@atproto/api'
import {useScrollEdgeEffectRef} from '@bsky.app/expo-scroll-edge-effect'

import {mergeRefs} from '#/lib/merge-refs'
import {ScrollProvider} from '#/lib/ScrollContext'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {
  convertBskyAppUrlIfNeeded,
  getChatInviteCodeFromUrl,
  isBskyPostUrl,
} from '#/lib/strings/url-helpers'
import {Logger, logger} from '#/logger'
import {
  type ActiveConvoStates,
  isConvoActive,
  useConvoActive,
} from '#/state/messages/convo'
import {type ConvoState, ConvoStatus} from '#/state/messages/convo/types'
import {useGetJoinLinkPreview} from '#/state/queries/join-links'
import {useGetPost} from '#/state/queries/post'
import {createEmbedViewRecordFromPost} from '#/state/queries/postgate/util'
import {useAgent, useSession} from '#/state/session'
import {List, type ListMethods} from '#/view/com/util/List'
import {MessageComposer} from '#/screens/Messages/components/MessageComposer'
import {MessageInput} from '#/screens/Messages/components/MessageInput'
import {MessageListError} from '#/screens/Messages/components/MessageListError'
import {atoms as a, platform, tokens, useTheme, web} from '#/alf'
import {DateDivider} from '#/components/dms/DateDivider'
import {MessageItem} from '#/components/dms/MessageItem'
import {MessageOverlays} from '#/components/dms/MessageOverlays'
import {NewMessagesPill} from '#/components/dms/NewMessagesPill'
import {SystemMessageGroup} from '#/components/dms/SystemMessageGroup'
import {SystemMessageItem} from '#/components/dms/SystemMessageItem'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID, IS_NATIVE, IS_WEB} from '#/env'
import {ChatStatusInfo} from './ChatStatusInfo'
import {groupSystemMessages, type RenderItem} from './groupSystemMessages'
import {InviteLinkDialogProvider} from './InviteLinkDialogProvider'
import {MessageInputEmbed, useMessageEmbed} from './MessageInputEmbed'
import {MessagesListGroupInfoPanel} from './MessagesListGroupInfoPanel'
import {MessagesListInfoPanel} from './MessagesListInfoPanel'
import {KeyboardStickyView} from './vendor/KeyboardStickyView'

// [CHATDBG] TEMP: routed through the conversation-agent context so it shows in
// the in-app System Log (which filters debug logs by context). Delete with the
// rest of the [CHATDBG] instrumentation.
const chatdbg = Logger.create(Logger.Context.ConversationAgent)

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
  const {hasSession} = useSession()
  const getPost = useGetPost()
  const getJoinLinkPreview = useGetJoinLinkPreview()
  const {embed: messageEmbed, setEmbed} = useMessageEmbed()
  const t = useTheme()

  const textInputId = 'chat-input-' + useId()
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

  const listOpacity = useSharedValue(0)

  useEffect(() => {
    chatdbg.debug('[CHATDBG] listOpacity effect', {
      t: Date.now(),
      convoId: convoState.convo?.view?.id,
      hasScrolled,
    })
    if (hasScrolled) {
      listOpacity.set(withTiming(1, {duration: 200}))
    } else {
      listOpacity.set(0)
    }
  }, [hasScrolled, listOpacity, convoState.convo?.view?.id])

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
      chatdbg.debug('[CHATDBG] onContentSizeChange enter', {
        t: Date.now(),
        convoId: convoState.convo?.view?.id,
        height,
        hasInitiallyScrolled: hasInitiallyScrolled.current,
        hasScrolled,
        renderItems: renderItems.length,
        isFetchingHistory: convoState.isFetchingHistory,
        isAtBottom: isAtBottom.get(),
        isAtTop: isAtTop.get(),
      })
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
      // Empty convos take this path too (once history is done) so hasScrolled gets set without an animated scroll.
      if (
        !hasInitiallyScrolled.current &&
        (renderItems.length > 0 || !convoState.isFetchingHistory)
      ) {
        hasInitiallyScrolled.current = true
        chatdbg.debug('[CHATDBG] onContentSizeChange INITIAL branch', {
          t: Date.now(),
          convoId: convoState.convo?.view?.id,
          renderItems: renderItems.length,
          isFetchingHistory: convoState.isFetchingHistory,
          willSetHasScrolled: !convoState.isFetchingHistory,
        })
        flatListRef.current?.scrollToOffset({offset: height, animated: false})
        // If history is already done loading, mark ready after a frame for the scroll to settle.
        // Otherwise, the footer sentinel's onLayout will handle it when history finishes.
        if (!convoState.isFetchingHistory) {
          requestAnimationFrame(() => {
            chatdbg.debug(
              '[CHATDBG] setHasScrolled(true) from onContentSizeChange rAF',
              {t: Date.now(), convoId: convoState.convo?.view?.id},
            )
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
      // these are stable
      flatListRef,
      isAtTop,
      isAtBottom,
      layoutHeight,
    ],
  )

  const onStartReached = useCallback(() => {
    chatdbg.debug('[CHATDBG] onStartReached -> fetchMessageHistory', {
      t: Date.now(),
      convoId: convoState.convo?.view?.id,
    })
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

      let embed:
        | $Typed<AppBskyEmbedRecord.Main>
        | $Typed<ChatBskyEmbedJoinLink.Main>
        | undefined
      let embedView:
        | $Typed<AppBskyEmbedRecord.View>
        | $Typed<ChatBskyEmbedJoinLink.View>
        | undefined

      // Find the embedded link facet and, if it's at the start or end of the
      // message, remove it from the text (the embed card replaces it).
      const stripLinkFacet = (predicate: (uri: string) => boolean) => {
        const linkFacet = rt.facets?.find(facet =>
          facet.features.find(
            feature =>
              AppBskyRichtextFacet.isLink(feature) && predicate(feature.uri),
          ),
        )
        if (linkFacet) {
          const isAtStart = linkFacet.index.byteStart === 0
          const isAtEnd =
            linkFacet.index.byteEnd === rt.unicodeText.graphemeLength
          if (isAtStart || isAtEnd) {
            rt.delete(linkFacet.index.byteStart, linkFacet.index.byteEnd)
          }
          rt = new RichText({text: rt.text.trim()}, {cleanNewlines: true})
        }
      }

      if (messageEmbed?.type === 'post') {
        try {
          const post = await getPost({uri: messageEmbed.uri})
          if (post) {
            embed = {
              $type: 'app.bsky.embed.record',
              record: {
                uri: post.uri,
                cid: post.cid,
              },
            }

            embedView = {
              $type: 'app.bsky.embed.record#view',
              record: createEmbedViewRecordFromPost(post),
            }

            stripLinkFacet(uri => {
              if (!isBskyPostUrl(uri)) return false
              const url = convertBskyAppUrlIfNeeded(uri)
              const [_0, _1, _2, rkey] = url.split('/').filter(Boolean)
              // this might have a handle instead of a DID
              // so just compare the rkey - not particularly dangerous
              return post.uri.endsWith(rkey)
            })
          }
        } catch (error) {
          logger.error('Failed to get post as quote for DM', {error})
        }
      } else if (messageEmbed?.type === 'invite') {
        const code = messageEmbed.code
        embed = {
          $type: 'chat.bsky.embed.joinLink',
          code,
        }

        const joinLinkPreview = await getJoinLinkPreview({code, hasSession})
        if (joinLinkPreview) {
          embedView = {
            $type: 'chat.bsky.embed.joinLink#view',
            joinLinkPreview,
          }
        }

        stripLinkFacet(uri => getChatInviteCodeFromUrl(uri) === code)
      }

      await rt.detectFacets(agent)

      rt = shortenLinks(rt)
      rt = stripInvalidMentions(rt)

      if (!hasScrolled) {
        setHasScrolled(true)
      }

      convoState.sendMessage(
        {
          text: rt.text,
          facets: rt.facets,
          embed,
        },
        embedView,
      )
    },
    [
      agent,
      convoState,
      messageEmbed,
      getPost,
      getJoinLinkPreview,
      hasSession,
      hasScrolled,
      setHasScrolled,
    ],
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
    chatdbg.debug('[CHATDBG] onFooterLayout enter', {
      t: Date.now(),
      convoId: convoState.convo?.view?.id,
      hasInitiallyScrolled: hasInitiallyScrolled.current,
      hasScrolled,
      isFetchingHistory: convoState.isFetchingHistory,
    })
    if (
      hasInitiallyScrolled.current &&
      !hasScrolled &&
      !convoState.isFetchingHistory
    ) {
      requestAnimationFrame(() => {
        chatdbg.debug(
          '[CHATDBG] setHasScrolled(true) from onFooterLayout rAF',
          {t: Date.now(), convoId: convoState.convo?.view?.id},
        )
        setHasScrolled(true)
      })
    }
  }, [
    hasScrolled,
    setHasScrolled,
    convoState.isFetchingHistory,
    convoState.convo?.view?.id,
  ])

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollComponent {...props} inputHeight={inputHeightUI} />
    ),
    [inputHeightUI],
  )

  const animatedListStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.get(),
  }))

  return (
    <InviteLinkDialogProvider convo={convoState.convo}>
      <MessageOverlays>
        <KeyboardGestureArea
          interpolator="ios"
          // HACKFIX: https://github.com/kirillzyusko/react-native-keyboard-controller/issues/1419
          offset={Math.round(inputHeightJS)}
          // slightly too buggy unfortunately, enable when possible
          // textInputNativeID={textInputId}
          style={[a.flex_1]}>
          {/* Custom scroll provider so that we can use the `onScroll` event in our custom List implementation */}
          <Animated.View style={[a.flex_1, animatedListStyle]}>
            <ScrollProvider onScroll={onScroll}>
              <List
                ref={flatListRef}
                data={renderItems}
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
                    {convoState.hasAllHistory ? (
                      convoState.convo?.kind === 'group' ? (
                        <MessagesListGroupInfoPanel convo={convoState.convo} />
                      ) : (
                        <MessagesListInfoPanel convo={convoState.convo} />
                      )
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
                style={[
                  web({
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${t.palette.contrast_100} transparent`,
                    scrollbarGutter: 'stable',
                  }),
                ]}
                pointerEvents={!hasScrolled ? 'none' : 'auto'}
                contentInset={{top: transparentHeaderHeight}}
                scrollIndicatorInsets={{top: transparentHeaderHeight}}
              />
            </ScrollProvider>
          </Animated.View>
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
                {({loading}) =>
                  ax.features.enabled(
                    ax.features.DmsNewMessageComposerEnable,
                  ) ? (
                    <MessageComposer
                      textInputId={textInputId}
                      onSendMessage={(message: string) =>
                        void onSendMessage(message)
                      }
                      hasEmbed={!!messageEmbed}
                      setEmbed={setEmbed}
                      loading={loading}>
                      <MessageInputEmbed
                        embed={messageEmbed}
                        setEmbed={setEmbed}
                      />
                    </MessageComposer>
                  ) : (
                    <MessageInput
                      textInputId={textInputId}
                      onSendMessage={onSendMessage}
                      hasEmbed={!!messageEmbed}
                      setEmbed={setEmbed}
                      loading={loading}>
                      <MessageInputEmbed
                        embed={messageEmbed}
                        setEmbed={setEmbed}
                      />
                    </MessageInput>
                  )
                }
              </ConversationFooter>
            )}
          </KeyboardStickyView>
        </KeyboardGestureArea>

        {newMessagesPill.show && (
          <NewMessagesPill onPress={scrollToEndOnPress} />
        )}
      </MessageOverlays>
    </InviteLinkDialogProvider>
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

// [CHATDBG] TEMP: dedupe key so the per-render getFooterState log only fires on
// change. Delete with the rest of the [CHATDBG] instrumentation.
let chatdbgLastFooterKey = ''

function getFooterState(
  convoState: ActiveConvoStates,
  hasAcceptOverride?: boolean,
): FooterState {
  let result: FooterState
  if (convoState.convo.view.status === 'request' && !hasAcceptOverride) {
    result = 'request'
  } else if (convoState.items.length === 0) {
    result = convoState.isFetchingHistory ? 'loading' : 'new-chat'
  } else {
    result = 'standard'
  }

  const key = `${convoState.convo?.view?.id}:${result}:${convoState.items.length}:${convoState.isFetchingHistory}:${convoState.status}`
  if (key !== chatdbgLastFooterKey) {
    chatdbgLastFooterKey = key
    chatdbg.debug('[CHATDBG] getFooterState', {
      t: Date.now(),
      convoId: convoState.convo?.view?.id,
      footerState: result,
      itemsLength: convoState.items.length,
      isFetchingHistory: convoState.isFetchingHistory,
      status: convoState.status,
    })
  }

  return result
}

function ConversationFooter({
  convoState,
  hasAcceptOverride,
  children,
}: {
  convoState: ConvoState
  hasAcceptOverride?: boolean
  children?: ((props: {loading?: boolean}) => React.ReactNode) | React.ReactNode
}) {
  if (!isConvoActive(convoState)) {
    return null
  }

  const footerState = getFooterState(convoState, hasAcceptOverride)
  const renderChildren = (loading?: boolean) =>
    typeof children === 'function' ? children({loading}) : children

  switch (footerState) {
    case 'loading':
      return renderChildren(true)
    case 'new-chat':
      // new chat pill goes here - removed for now
      return renderChildren()
    case 'request':
      return <ChatStatusInfo convoState={convoState} />
    case 'standard':
      return renderChildren()
  }
}

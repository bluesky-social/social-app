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
  FadeIn,
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
  ChatBskyGroupDefs,
  RichText,
} from '@atproto/api'
import {useScrollEdgeEffectRef} from '@bsky.app/expo-scroll-edge-effect'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {mergeRefs} from '#/lib/merge-refs'
import {ScrollProvider} from '#/lib/ScrollContext'
import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {
  convertBskyAppUrlIfNeeded,
  getChatInviteCodeFromUrl,
  isBskyPostUrl,
} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
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
import {
  type MessageEmbedState,
  MessageInputEmbed,
  useMessageEmbed,
} from './MessageInputEmbed'
import {MessageInputReply} from './MessageInputReply'
import {MessagesListGroupInfoPanel} from './MessagesListGroupInfoPanel'
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
  const {hasSession, currentAccount} = useSession()
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
    if (hasScrolled) {
      listOpacity.set(withTiming(1, {duration: 200}))
    } else {
      listOpacity.set(0)
    }
  }, [hasScrolled, listOpacity])

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
  // `didInitialScroll` is the reactive mirror of the ref so the reveal effect below can depend on it; the ref
  // itself stays as the synchronous re-entry guard inside onContentSizeChange.
  const hasInitiallyScrolled = useRef(false)
  const [didInitialScroll, setDidInitialScroll] = useState(false)
  const prevHasScrolled = useRef(hasScrolled)
  useLayoutEffect(() => {
    if (prevHasScrolled.current && !hasScrolled) {
      hasInitiallyScrolled.current = false
      setDidInitialScroll(false)
    }
    prevHasScrolled.current = hasScrolled
  }, [hasScrolled])

  // Reveal the list once history has finished loading. We can't reveal earlier because the list isn't inverted -
  // we must scroll to the bottom (newest message) before fading in, or the user sees a flash of top-anchored content.
  // This is purely state-driven so it doesn't depend on a layout callback firing: a firehose-delivered message can
  // dedupe against the fetched history and produce no content-size change, in which case nothing would otherwise
  // reveal the list and it would stay hidden forever (APP-2238). Either the initial scroll has run, or there's
  // nothing to scroll (empty convo) - both are safe to reveal once !isFetchingHistory.
  useEffect(() => {
    if (hasScrolled || convoState.isFetchingHistory) return
    if (didInitialScroll || renderItems.length === 0) {
      const raf = requestAnimationFrame(() => setHasScrolled(true))
      return () => cancelAnimationFrame(raf)
    }
  }, [
    convoState.isFetchingHistory,
    hasScrolled,
    didInitialScroll,
    renderItems.length,
    setHasScrolled,
  ])

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
      // Empty convos take this path too (once history is done). Revealing the list is handled by the effect above,
      // which fires once history finishes - we just record that the scroll has happened.
      if (
        !hasInitiallyScrolled.current &&
        (renderItems.length > 0 || !convoState.isFetchingHistory)
      ) {
        hasInitiallyScrolled.current = true
        setDidInitialScroll(true)
        flatListRef.current?.scrollToOffset({offset: height, animated: false})
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
            // only animate when new items were appended - pure layout growth
            // (e.g. the composer spacer getting its height on web) should
            // snap instantly rather than visibly scrolling
            animated:
              hasScrolled &&
              height > prevContentHeight.current &&
              renderItems.length > prevItemCount.current,
          })
        }
      }

      prevContentHeight.current = height
      prevItemCount.current = renderItems.length
      didBackground.current = false
    },
    [
      hasScrolled,
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
    async (text: string, reply?: $Typed<ChatBskyConvoDefs.MessageView>) => {
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
      let replyTo: ChatBskyConvoDefs.ReplyRef | undefined

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

      if (reply) {
        replyTo = {messageId: reply.id}
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
          replyTo,
        },
        embedView,
        reply,
      )

      if (replyTo) {
        ax.metric('chat:message:reply:send', {
          convoId: convoState.convo.view.id,
          isGroup: convoState.convo.kind === 'group',
        })
      }
      if (convoState.convo.kind === 'group') {
        ax.metric('groupchat:message:send', {
          convoId: convoState.convo.view.id,
          isOwner: convoState.convo.primaryMember?.did === currentAccount?.did,
        })
      }
      if (
        embedView?.$type === 'chat.bsky.embed.joinLink#view' &&
        ChatBskyGroupDefs.isJoinLinkPreviewView(embedView.joinLinkPreview)
      ) {
        ax.metric('groupchat:inviteLink:shared', {
          convoId: embedView.joinLinkPreview.convoId,
          method: 'dm',
        })
      }
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
      ax,
      currentAccount?.did,
    ],
  )

  const scrollToEndOnPress = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset: prevContentHeight.current,
      animated: true,
    })
  }, [flatListRef])

  // Scroll to a message by id, if it's currently loaded in the list. Per the
  // feature scope, we don't fetch history to find unloaded messages - tapping a
  // reply to an out-of-window message is a no-op.
  const scrollToMessage = useNonReactiveCallback((messageId: string) => {
    const index = renderItems.findIndex(
      item =>
        (item.type === 'message' ||
          item.type === 'pending-message' ||
          item.type === 'deleted-message') &&
        item.message.id === messageId,
    )
    if (index === -1) return

    ax.metric('chat:message:reply:tap', {convoId: convoState.convo.view.id})
    flatListRef.current?.scrollToIndex({
      index,
      viewPosition: 0.3,
      animated: true,
    })
  })

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
      <MessageOverlays scrollToMessage={scrollToMessage}>
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
              <Animated.View entering={FadeIn.duration(200)}>
                <ConversationFooter
                  convoState={convoState}
                  hasAcceptOverride={hasAcceptOverride}>
                  {({loading}) => (
                    <Composer
                      textInputId={textInputId}
                      onSendMessage={onSendMessage}
                      messageEmbed={messageEmbed}
                      setEmbed={setEmbed}
                      loading={loading}
                      useNewComposer={ax.features.enabled(
                        ax.features.DmsNewMessageComposerEnable,
                      )}
                    />
                  )}
                </ConversationFooter>
              </Animated.View>
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

/**
 * Bridges the composer to reply state. It's rendered inside `MessageOverlays`
 * so it can read the staged reply target via `useMessageDialogs`, inject it
 * into the send call, then clear it. The reply preview is mounted alongside the
 * existing embed preview in the composer's children slot.
 */
function Composer({
  textInputId,
  onSendMessage,
  messageEmbed,
  setEmbed,
  loading,
  useNewComposer,
}: {
  textInputId: string
  onSendMessage: (
    message: string,
    replyTo?: $Typed<ChatBskyConvoDefs.MessageView>,
  ) => Promise<void>
  messageEmbed: MessageEmbedState | undefined
  setEmbed: (embedUrl: string | undefined) => void
  loading?: boolean
  useNewComposer: boolean
}) {
  const handleSendMessage = useNonReactiveCallback(
    (message: string, replyTo?: $Typed<ChatBskyConvoDefs.MessageView>) => {
      void onSendMessage(message, replyTo)
    },
  )

  const previews = (
    <>
      <MessageInputReply />
      <MessageInputEmbed embed={messageEmbed} setEmbed={setEmbed} />
    </>
  )

  return useNewComposer ? (
    <MessageComposer
      textInputId={textInputId}
      onSendMessage={handleSendMessage}
      hasEmbed={!!messageEmbed}
      setEmbed={setEmbed}
      loading={loading}>
      {previews}
    </MessageComposer>
  ) : (
    <MessageInput
      textInputId={textInputId}
      onSendMessage={handleSendMessage}
      hasEmbed={!!messageEmbed}
      setEmbed={setEmbed}
      loading={loading}>
      {previews}
    </MessageInput>
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
  const isRequest =
    convoState.convo.view.status === 'request' && !hasAcceptOverride

  // For group chats, the request footer is driven purely off status: the owner
  // is always 'accepted' so never sees it, while members the owner added are
  // 'request' until they accept. This holds even before any messages load.
  if (convoState.convo.kind === 'group' && isRequest) {
    return 'request'
  }

  if (convoState.items.length === 0) {
    if (convoState.isFetchingHistory) {
      return 'loading'
    } else {
      return 'new-chat'
    }
  }

  // For direct chats, only show the request footer once there's a message. The
  // viewer's status stays 'request' until they send their first message, so an
  // empty direct request is one the viewer started themselves (show the
  // composer), whereas any message present must be an incoming one from the
  // other user (show the accept/reject footer).
  if (isRequest) {
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

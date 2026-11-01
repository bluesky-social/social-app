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
  type ScrollEvent,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {scheduleOnRN} from 'react-native-worklets'
import {type $Typed} from '@atproto/lex'
import {useScrollEdgeEffectRef} from '@bsky.app/expo-scroll-edge-effect'
import {RichText} from '@bsky/sdk/richtext'

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
import {useAppviewClient, useSession} from '#/state/session'
import {List, type ListMethods} from '#/view/com/util/List'
import {MessageComposer} from '#/screens/Messages/components/MessageComposer'
import {MessageListError} from '#/screens/Messages/components/MessageListError'
import {atoms as a, platform, tokens, useTheme, web} from '#/alf'
import {DateDivider} from '#/components/dms/DateDivider'
import {
  MessageItem,
  type MessageItemNeighbor,
} from '#/components/dms/MessageItem'
import {MessageOverlays} from '#/components/dms/MessageOverlays'
import {MessageRepliesProvider} from '#/components/dms/MessageReplies'
import {NewMessagesPill} from '#/components/dms/NewMessagesPill'
import {SystemMessageGroup} from '#/components/dms/SystemMessageGroup'
import {SystemMessageItem} from '#/components/dms/SystemMessageItem'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID, IS_NATIVE, IS_WEB} from '#/env'
import {app, chat} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {ChatStatusInfo} from './ChatStatusInfo'
import {groupSystemMessages, type RenderItem} from './groupSystemMessages'
import {InviteLinkDialogProvider} from './InviteLinkDialogProvider'
import {getMessageComposerKeyboardOffsets} from './messageComposerLayout'
import {
  type MessageEmbedState,
  MessageInputEmbed,
  useMessageEmbed,
} from './MessageInputEmbed'
import {MessageInputReply} from './MessageInputReply'
import {MessagesListGroupInfoPanel} from './MessagesListGroupInfoPanel'
import {MessagesListInfoPanel} from './MessagesListInfoPanel'
import {KeyboardStickyView} from './vendor/KeyboardStickyView'

const SATURATING_SCROLL_OFFSET = 1e7
/** How long the list stays frozen after a send's scroll starts. */
const SEND_SCROLL_SETTLE_MS = 400
/** Stops holding the list still if a send is slow to append its message. */
const SEND_HOLD_TIMEOUT_MS = 1000

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
): MessageItemNeighbor {
  const neighbor = items[index]
  if (!neighbor) return null
  if (
    neighbor.type === 'message' ||
    neighbor.type === 'pending-message' ||
    neighbor.type === 'deleted-message'
  ) {
    if (
      bsky.isType(chat.bsky.convo.defs.messageView, neighbor.message) ||
      bsky.isType(chat.bsky.convo.defs.deletedMessageView, neighbor.message)
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
  /*
   * Facet/mention resolution is an appview job - it resolves handles through
   * the appview, and the public fallback keeps it working when logged out.
   */
  const appviewClient = useAppviewClient()
  const {hasSession, currentAccount} = useSession()
  const getPost = useGetPost()
  const getJoinLinkPreview = useGetJoinLinkPreview()
  const {embed: messageEmbed, setEmbed} = useMessageEmbed()
  const t = useTheme()

  const textInputId = 'chat-input-' + useId()
  const flatListRef = useRef<ListMethods | null>(null)

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

  // Recreate FadeIn for the footer with a shared value so we can start from a
  // non-zero opacity instead of fully transparent. (Needed for GlassView to work properly)
  const footerOpacity = useSharedValue(0.05)

  useEffect(() => {
    footerOpacity.set(withTiming(1, {duration: 200}))
  }, [footerOpacity])

  const inputHeightUI = useSharedValue(0)
  const [inputHeightJS, setInputHeightJS] = useState(0)

  /*
   * -- Sending
   *
   * A send should take the reader to their message in one motion, whatever
   * they were doing. The composer clears (and a multi-line one shrinks back to
   * one line) about a frame before the message is appended and laid out, so
   * until then the list is held still:
   *
   * - KeyboardChatScrollView is frozen, or it would shift the list down to
   *   follow the shrinking composer.
   * - The list's bottom inset keeps the composer's pre-send height. Shrinking
   *   it under content that hasn't grown yet makes UIKit clamp the scroll
   *   offset, which drops the list just the same.
   *
   * Once our pending message has laid out, the inset catches up and a single
   * scroll takes the list to the end (see onPendingMessageLayout).
   */

  /**
   * Set when the local user sends a message, so we follow it to the end even
   * from a scrolled-up position. It's consumed by the first pending message to
   * lay out, so a foreign message arriving between the send and our append
   * can't consume it or yank a scrolled-up reader down.
   */
  const pendingSendScroll = useRef(false)
  const sendScrollFreeze = useSharedValue(false)
  const sendHoldsInset = useRef(false)
  /** The composer height the held inset will catch up to. */
  const deferredInputHeight = useRef<number | null>(null)
  const sendScrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  /** Lets the held inset catch up. Returns whether it changed. */
  const releaseSendInset = useCallback(() => {
    sendHoldsInset.current = false
    const deferred = deferredInputHeight.current
    deferredInputHeight.current = null
    if (deferred === null) return false
    inputHeightUI.set(deferred)
    return true
  }, [inputHeightUI])

  /** Stops holding the list still, without giving up on the scroll. */
  const releaseSendHold = useCallback(() => {
    releaseSendInset()
    sendScrollFreeze.set(false)
  }, [releaseSendInset, sendScrollFreeze])

  /** Abandons an in-flight send scroll and hands layout back. */
  const cancelSendScroll = useCallback(() => {
    clearTimeout(sendScrollTimer.current)
    pendingSendScroll.current = false
    releaseSendHold()
  }, [releaseSendHold])
  useEffect(() => () => clearTimeout(sendScrollTimer.current), [])

  const onInputLayout = (event: LayoutChangeEvent) => {
    const inputHeight = event.nativeEvent.layout.height
    setInputHeightJS(inputHeight)
    if (sendHoldsInset.current && inputHeight < inputHeightUI.get()) {
      deferredInputHeight.current = inputHeight
      return
    }
    deferredInputHeight.current = null
    inputHeightUI.set(inputHeight)
  }

  /**
   * We need to keep track of when the scroll offset is at the bottom of the list
   * to know when to scroll as new items are added to the list. For example, if
   * the user is scrolled up to view older messages, we don't want to scroll to
   * the bottom.
   */
  const isAtBottom = useSharedValue(true)
  /** Distance from the bottom of the viewport to the end of the content. */
  const distanceFromEnd = useSharedValue(0)

  /** This will be used on web to assist in determining if we need to maintain the content offset */
  const isAtTop = useSharedValue(true)

  /**
   * Used to keep track of the current content height. We'll need this in
   * `onScroll` so we know when to start allowing onStartReached to fire.
   */
  const prevContentHeight = useRef(0)
  const prevItemCount = useRef(0)

  /**
   * Tracks whether the initial scroll-to-bottom has been triggered. Separated
   * from isAtBottom so that contentInset (which causes an early onScroll with
   * negative offset) can't prevent the first scroll. Reset when hasScrolled goes
   * back to false (e.g. convo re-initialization after backgrounding).
   * `didInitialScroll` is the reactive mirror of the ref so the reveal effect
   * below can depend on it; the ref itself stays as the synchronous re-entry
   * guard inside onContentSizeChange.
   */
  const hasInitiallyScrolled = useRef(false)
  const [didInitialScroll, setDidInitialScroll] = useState(false)
  const prevHasScrolled = useRef(hasScrolled)
  useLayoutEffect(() => {
    if (prevHasScrolled.current && !hasScrolled) {
      hasInitiallyScrolled.current = false
      setDidInitialScroll(false)
      /*
       * Drop any unfired send scroll and its freeze: the initial-scroll path
       * owns positioning during re-init, and the pending message they referred
       * to belongs to the previous lifecycle.
       */
      cancelSendScroll()
    }
    prevHasScrolled.current = hasScrolled
  }, [hasScrolled, cancelSendScroll])

  /*
   * Reveal the list once history has finished loading. We can't reveal earlier
   * because the list isn't inverted - we must scroll to the bottom (newest
   * message) before fading in, or the user sees a flash of top-anchored content.
   * This is purely state-driven so it doesn't depend on a layout callback
   * firing: a firehose-delivered message can dedupe against the fetched history
   * and produce no content-size change, in which case nothing would otherwise
   * reveal the list and it would stay hidden forever (APP-2238). Either the
   * initial scroll has run, or there's nothing to scroll (empty convo) - both
   * are safe to reveal once !isFetchingHistory.
   */
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

  /**
   * Scroll to a saturating offset rather than scrollToEnd: when the keyboard is
   * open, KeyboardChatScrollView lifts the content via extraContentPadding, and
   * scrollToEnd's internal target is unaware of that lift, so it lands short by
   * the keyboard height. An over-large offset clamps to the true bottom.
   *
   * The offset must stay within Android's native scroll range: View.scrollTo
   * takes a 32-bit int, so Number.MAX_SAFE_INTEGER (~9e15) overflows and lands
   * on a garbage position - the list paints blank and maintainVisibleContent
   * Position then re-anchors to index 0 (the top). iOS uses a CGFloat offset and
   * clamps MAX_SAFE_INTEGER fine, but a value larger than any conceivable chat
   * content clamps to the true bottom just as well on both, so we use one that
   * fits comfortably in int32. (APP-2223)
   */
  const reduceMotion = useReducedMotion()
  const scrollSendToBottom = () => {
    flatListRef.current?.scrollToOffset({
      offset: SATURATING_SCROLL_OFFSET,
      animated: !reduceMotion,
    })
  }

  /** Called as a send is accepted, before the composer clears. */
  const onWillSendMessage = () => {
    pendingSendScroll.current = true
    sendHoldsInset.current = true
    sendScrollFreeze.set(true)
    /*
     * Don't hold the list still for long if the message is slow to land. The
     * scroll itself stays armed: on a busy device the row can take well over a
     * second to lay out, and only our own sends append pending rows.
     */
    clearTimeout(sendScrollTimer.current)
    sendScrollTimer.current = setTimeout(releaseSendHold, SEND_HOLD_TIMEOUT_MS)

    /*
     * From more than a screen up, jump to the end straight away. The list only
     * renders rows appended at the end while it's near the end, so our message
     * wouldn't otherwise mount or lay out until the reader got there - and
     * animating across several screens is mostly a blur anyway.
     */
    if (distanceFromEnd.get() > layoutHeight.get()) {
      flatListRef.current?.scrollToOffset({
        offset: SATURATING_SCROLL_OFFSET,
        animated: false,
      })
    }
  }

  /**
   * Follow a just-sent message to the end, once its pending row has laid out.
   * By then the content size includes it, so a single scroll lands on the
   * true end. Scrolling any earlier (e.g. when the item is merely committed)
   * targets the old end, and re-issuing an animated scroll every frame until
   * the layout settles restarts the animation each time, so the list barely
   * moves until the last one.
   */
  const onPendingMessageLayout = () => {
    if (!pendingSendScroll.current) return
    pendingSendScroll.current = false
    const insetChanged = releaseSendInset()
    /*
     * The scroll's target is clamped to the content's extent when it's
     * issued, so a shrinking inset has to land first.
     */
    if (insetChanged) {
      requestAnimationFrame(scrollSendToBottom)
    } else {
      scrollSendToBottom()
    }
    clearTimeout(sendScrollTimer.current)
    sendScrollTimer.current = setTimeout(() => {
      sendScrollFreeze.set(false)
    }, SEND_SCROLL_SETTLE_MS)
  }

  // -- Scroll handling

  /**
   * Every time the content size changes, that means one of two things is happening:
   * 1. New messages are being added from the log or from a message you have sent
   * 2. Old messages are being prepended to the top
   *
   * The first time that the content size changes is when the initial items are
   * rendered. Because we cannot rely on `initialScrollIndex`, we need to
   * immediately scroll to the bottom of the list. That scroll will not be
   * animated.
   *
   * Subsequent resizes will only scroll to the bottom if the user is at the
   * bottom of the list (within 100 pixels of the bottom). Therefore, any new
   * messages that come in or are sent will result in an animated scroll to end.
   * However we will not scroll whenever new items get prepended to the top.
   */
  const onContentSizeChange = (_: number, height: number) => {
    /*
     * Because web does not have `maintainVisibleContentPosition` support, we
     * will need to manually scroll to the previous offset whenever we add new
     * content to the list.
     */
    if (IS_WEB && isAtTop.get() && hasScrolled) {
      flatListRef.current?.scrollToOffset({
        offset: height - prevContentHeight.current,
        animated: false,
      })
    }

    /*
     * Initial scroll to bottom - unconditional, not gated on isAtBottom. This
     * is separated because contentInset can cause an early onScroll with a
     * negative offset that sets isAtBottom to false before we get here. Empty
     * convos take this path too (once history is done). Revealing the list is
     * handled by the effect above, which fires once history finishes - we just
     * record that the scroll has happened.
     */
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

    /*
     * Subsequent: auto-scroll only if user is at the bottom. While a send
     * holds the list, onPendingMessageLayout scrolls it - a second animated
     * scroll here would restart that one.
     */
    if (isAtBottom.get() && !sendScrollFreeze.get()) {
      /*
       * If the size of the content is changing by more than the height of the
       * screen, then we don't want to scroll further than the start of all the
       * new content. Since we are storing the previous offset, we can just
       * scroll the user to that offset and add a little bit of padding. We'll
       * also show the pill that can be pressed to immediately scroll to the
       * end.
       */
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
          /*
           * only animate when new items were appended - pure layout growth
           * (e.g. the composer spacer getting its height on web) should snap
           * instantly rather than visibly scrolling
           */
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
  }

  const onStartReached = useCallback(() => {
    void convoState.fetchMessageHistory()
  }, [convoState])

  const onScroll = (e: ScrollEvent) => {
    'worklet'
    layoutHeight.set(e.layoutMeasurement.height)
    const bottomOffset = e.contentOffset.y + e.layoutMeasurement.height

    /*
     * Most apps have a little bit of space the user can scroll past while
     * still automatically scrolling to the bottom when a new message is added,
     * hence the 100 pixel offset
     */
    isAtBottom.set(e.contentSize.height - 100 < bottomOffset)
    distanceFromEnd.set(e.contentSize.height - bottomOffset)
    isAtTop.set(e.contentOffset.y <= 1)

    if (
      newMessagesPill.show &&
      (e.contentOffset.y > newMessagesPill.startContentOffset + 200 ||
        isAtBottom.get())
    ) {
      scheduleOnRN(setNewMessagesPill, {
        show: false,
        startContentOffset: 0,
      })
    }
  }

  /** A drag takes over from any send scroll that hasn't run yet. */
  const onBeginDrag = () => {
    'worklet'
    sendScrollFreeze.set(false)
    scheduleOnRN(cancelSendScroll)
  }

  // -- Keyboard animation handling

  const {bottom: bottomInset} = useSafeAreaInsets()
  const {stickyViewClosedOffset} =
    getMessageComposerKeyboardOffsets(bottomInset)

  // -- Message sending
  const onSendMessage = useCallback(
    async (
      text: string,
      embedState?: MessageEmbedState,
      reply?: $Typed<chat.bsky.convo.defs.MessageView>,
    ) => {
      let rt = new RichText({text: text.trimEnd()}, {cleanNewlines: true})

      /*
       * detect facets without resolution first - this is used to see if there's
       * any post links in the text that we can embed. We do this first because
       * we want to remove the post link from the text, re-trim, then detect
       * facets
       */
      rt.detectFacetsWithoutResolution()

      let embed: chat.bsky.convo.defs.MessageInput['embed']
      let embedView:
        | $Typed<app.bsky.embed.record.View>
        | $Typed<chat.bsky.embed.joinLink.View>
        | undefined
      let replyTo: chat.bsky.convo.defs.ReplyRef | undefined

      /**
       * Find the embedded link facet and, if it's at the start or end of the
       * message, remove it from the text (the embed card replaces it).
       */
      const stripLinkFacet = (predicate: (uri: string) => boolean) => {
        const linkFacet = rt.facets?.find(facet =>
          facet.features.find(
            feature =>
              bsky.isType(app.bsky.richtext.facet.link, feature) &&
              predicate(feature.uri),
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

      if (embedState?.type === 'post') {
        try {
          const post = await getPost({uri: embedState.uri})
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
              /*
               * this might have a handle instead of a DID so just compare the
               * rkey - not particularly dangerous
               */
              return post.uri.endsWith(rkey)
            })
          }
        } catch (error) {
          logger.error('Failed to get post as quote for DM', {error})
        }
      } else if (embedState?.type === 'invite') {
        const code = embedState.code
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

      await rt.detectFacets(appviewClient)

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
        bsky.isType(
          chat.bsky.group.defs.joinLinkPreviewView,
          embedView.joinLinkPreview,
        )
      ) {
        ax.metric('groupchat:inviteLink:shared', {
          convoId: embedView.joinLinkPreview.convoId,
          method: 'dm',
        })
      }
    },
    [
      appviewClient,
      convoState,
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

  /**
   * Scroll to a message by id, if it's currently loaded in the list. Per the
   * feature scope, we don't fetch history to find unloaded messages - tapping a
   * reply to an out-of-window message is a no-op. Returns whether the message
   * was found, so the caller knows whether to flash it.
   */
  const scrollToMessage = useNonReactiveCallback((messageId: string) => {
    const index = renderItems.findIndex(
      item =>
        (item.type === 'message' ||
          item.type === 'pending-message' ||
          item.type === 'deleted-message') &&
        item.message.id === messageId,
    )
    if (index === -1) return false

    ax.metric('chat:message:reply:tap', {convoId: convoState.convo.view.id})
    flatListRef.current?.scrollToIndex({
      index,
      viewPosition: 0.3,
      animated: true,
    })
    return true
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
          onLayout={
            item.type === 'pending-message' ? onPendingMessageLayout : undefined
          }
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
      <ChatScrollComponent
        {...props}
        inputHeight={inputHeightUI}
        freeze={sendScrollFreeze}
      />
    ),
    [inputHeightUI, sendScrollFreeze],
  )

  const animatedListStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.get(),
  }))

  const animatedFooterStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.get(),
  }))

  return (
    <InviteLinkDialogProvider convo={convoState.convo}>
      <MessageRepliesProvider scrollToMessage={scrollToMessage}>
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
              <ScrollProvider onScroll={onScroll} onBeginDrag={onBeginDrag}>
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
                          <MessagesListGroupInfoPanel
                            convo={convoState.convo}
                          />
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
              minimumOffset={IS_WEB ? 0 : bottomInset}
              offset={{
                closed: platform({
                  ios: stickyViewClosedOffset,
                  default: 0,
                }),
                opened: 0,
              }}>
              {footer ?? (
                <Animated.View style={animatedFooterStyle}>
                  <ConversationFooter
                    convoState={convoState}
                    hasAcceptOverride={hasAcceptOverride}>
                    {({loading}) => (
                      <Composer
                        textInputId={textInputId}
                        onWillSendMessage={onWillSendMessage}
                        onSendMessage={onSendMessage}
                        messageEmbed={messageEmbed}
                        setEmbed={setEmbed}
                        loading={loading}
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
      </MessageRepliesProvider>
    </InviteLinkDialogProvider>
  )
}

/**
 * Picks the new vs legacy composer and mounts the reply preview alongside the
 * existing embed preview in the composer's children slot. The staged reply
 * itself is read and cleared inside the composer via `useMessageReplies`.
 */
function Composer({
  textInputId,
  onWillSendMessage,
  onSendMessage,
  messageEmbed,
  setEmbed,
  loading,
}: {
  textInputId: string
  onWillSendMessage: () => void
  onSendMessage: (
    message: string,
    embed?: MessageEmbedState,
    replyTo?: $Typed<chat.bsky.convo.defs.MessageView>,
  ) => Promise<void>
  messageEmbed: MessageEmbedState | undefined
  setEmbed: (embedUrl: string | undefined) => void
  loading?: boolean
}) {
  const handleSendMessage = useNonReactiveCallback(
    (
      message: string,
      embed?: MessageEmbedState,
      replyTo?: $Typed<chat.bsky.convo.defs.MessageView>,
    ) => {
      void onSendMessage(message, embed, replyTo)
    },
  )

  return (
    <MessageComposer
      textInputId={textInputId}
      onWillSendMessage={onWillSendMessage}
      onSendMessage={handleSendMessage}
      messageEmbed={messageEmbed}
      setEmbed={setEmbed}
      loading={loading}>
      <MessageInputReply />
      <MessageInputEmbed embed={messageEmbed} setEmbed={setEmbed} />
    </MessageComposer>
  )
}

/** Note: native only */
function ChatScrollComponent({
  ref,
  inputHeight,
  freeze,
  ...props
}: ScrollViewProps & {
  ref?: React.RefObject<KeyboardChatScrollViewProps>
  inputHeight: SharedValue<number>
  freeze: SharedValue<boolean>
}) {
  const scrollEdgeRef = useScrollEdgeEffectRef()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const {chatScrollOffset} = getMessageComposerKeyboardOffsets(bottomInset)

  const offset = platform({
    ios: chatScrollOffset,
    android: bottomInset,
    default: 0,
  })

  const inputOffset = platform({
    ios: chatScrollOffset,
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
      freeze={freeze}
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

  /*
   * For group chats, the request footer is driven purely off status: the owner
   * is always 'accepted' so never sees it, while members the owner added are
   * 'request' until they accept. This holds even before any messages load.
   */
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

  /*
   * For direct chats, only show the request footer once there's a message. The
   * viewer's status stays 'request' until they send their first message, so an
   * empty direct request is one the viewer started themselves (show the
   * composer), whereas any message present must be an incoming one from the
   * other user (show the accept/reject footer).
   */
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

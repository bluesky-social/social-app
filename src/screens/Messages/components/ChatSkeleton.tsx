import {useCallback, useMemo, useRef} from 'react'
import {ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ChatBskyConvoDefs} from '@atproto/api'
import {useScrollEdgeEffectRef} from '@bsky.app/expo-scroll-edge-effect'

import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {
  getBubbleColor,
  getBubbleRadii,
  getMessageInset,
} from '#/components/dms/bubbleStyles'
import {
  AVATAR_SIZE,
  BUBBLE_GAP,
  type ConvoWithDetails,
  INITIAL_NUMBER_TO_RENDER,
} from '#/components/dms/util'
import {Text} from '#/components/Typography'
import {IS_LIQUID_GLASS} from '#/env'

type Side = 'incoming' | 'outgoing'

type SkeletonBubble =
  | {side: Side; widthPct: number; height: number; text?: undefined}
  | {side: Side; text: string}

/**
 * Pre-seeded pattern that approximates a busy chat. Cluster boundaries are
 * derived from adjacent bubbles' `side` values.
 */
const SKELETON_PATTERN: SkeletonBubble[] = [
  {side: 'outgoing', widthPct: 55, height: 36},
  {side: 'outgoing', widthPct: 40, height: 36},
  {side: 'incoming', widthPct: 60, height: 36},
  {side: 'outgoing', widthPct: 35, height: 36},
  {side: 'incoming', widthPct: 45, height: 36},
  {side: 'outgoing', widthPct: 70, height: 56},
  {side: 'outgoing', widthPct: 50, height: 36},
  {side: 'incoming', widthPct: 55, height: 36},
  {side: 'outgoing', widthPct: 65, height: 36},
  {side: 'incoming', widthPct: 50, height: 36},
  {side: 'outgoing', widthPct: 45, height: 36},
  {side: 'incoming', widthPct: 40, height: 36},
  {side: 'outgoing', widthPct: 55, height: 36},
  {side: 'outgoing', widthPct: 60, height: 36},
  {side: 'incoming', widthPct: 50, height: 36},
]

export function ChatSkeleton({
  convo,
  bottomPadding = 0,
  transparentHeaderHeight = 0,
}: {
  convo: ConvoWithDetails | null
  /**
   * Reserved space at the bottom for the composer area. The skeleton lives in
   * the same flex slot as the real list, with the composer overlaying its
   * bottom region, so the bottommost bubble needs to clear that overlap.
   */
  bottomPadding?: number
  /**
   * On Liquid Glass, the floating header overlays the top of this view.
   * Mirrors `MessagesList`'s prop so the skeleton's scroll view also drives
   * the header's top edge-effect blur while the real list isn't mounted yet.
   */
  transparentHeaderHeight?: number
}) {
  const t = useTheme()
  const {currentAccount} = useSession()
  const {bottom: bottomInset} = useSafeAreaInsets()
  const isGroup = convo?.kind === 'group'

  // Under Liquid Glass the scroll view's frame reaches past the bottom safe
  // area, and iOS's default `contentInsetAdjustmentBehavior` is timing-
  // dependent about whether it adds `bottomInset` to `contentInset.bottom`.
  // We force `"always"` below for a deterministic ~bottomInset of implicit
  // inset, then subtract it from the caller's reservation here so the
  // bottommost bubble lines up with the first rendered message.
  const adjustedPaddingBottom = IS_LIQUID_GLASS
    ? bottomPadding - bottomInset
    : bottomPadding

  // Register this scroll view as the source for the header's top edge-effect
  // blur (Liquid Glass) on mount, but skip the unregistration on unmount.
  // `MessagesList` registers its own scroll view shortly after, and we don't
  // want this view's FadeOut to clear that registration when it finally
  // unmounts. No-op on platforms where `useScrollEdgeEffectRef` returns
  // undefined.
  const scrollEdgeRef = useScrollEdgeEffectRef()
  const scrollViewRef = useRef<ScrollView | null>(null)
  const setScrollViewRef = useCallback(
    (node: ScrollView | null) => {
      scrollViewRef.current = node
      if (node && scrollEdgeRef) {
        scrollEdgeRef(node)
      }
    },
    [scrollEdgeRef],
  )

  // Placeholders with the real `lastMessage` appended at the bottom if it's a
  // regular message - deleted and system messages are skipped.
  const bubbles = useMemo<SkeletonBubble[]>(() => {
    const list: SkeletonBubble[] = Array.from(
      {length: INITIAL_NUMBER_TO_RENDER},
      (_, i) => SKELETON_PATTERN[i % SKELETON_PATTERN.length],
    )
    const lastMessage = convo?.view.lastMessage
    if (lastMessage && ChatBskyConvoDefs.isMessageView(lastMessage)) {
      list.push({
        side:
          lastMessage.sender.did === currentAccount?.did
            ? 'outgoing'
            : 'incoming',
        text: lastMessage.text,
      })
    }
    return list
  }, [convo, currentAccount?.did])

  return (
    <ScrollView
      ref={setScrollViewRef}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      style={[a.flex_1]}
      contentInset={{top: transparentHeaderHeight}}
      contentInsetAdjustmentBehavior="always"
      contentContainerStyle={[
        a.justify_end,
        {flexGrow: 1, paddingBottom: adjustedPaddingBottom},
      ]}
      onContentSizeChange={() => {
        scrollViewRef.current?.scrollToEnd({animated: false})
      }}>
      <View>
        {bubbles.map((bubble, i) => {
          const prev = bubbles[i - 1]
          const next = bubbles[i + 1]
          const isFirstInCluster = !prev || prev.side !== bubble.side
          const isLastInCluster = !next || next.side !== bubble.side
          const isIncoming = bubble.side === 'incoming'
          const showAvatar = isGroup && isIncoming && isLastInCluster
          const isRealMessage = bubble.text !== undefined

          const radii = getBubbleRadii({
            isIncoming,
            isFirstInCluster,
            isLastInCluster,
          })

          const bubbleColor = getBubbleColor(t, {
            isIncoming,
            isRealMessage,
          })

          const rowInset = getMessageInset({
            isIncoming,
            isGroupChat: isGroup,
          })

          return (
            <View
              key={i}
              style={[
                a.flex_row,
                a.align_end,
                isIncoming ? a.justify_start : a.justify_end,
                rowInset,
                isFirstInCluster ? a.mt_md : {marginTop: BUBBLE_GAP},
              ]}>
              {isGroup && isIncoming ? (
                <View
                  style={[
                    a.rounded_full,
                    {
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      opacity: showAvatar ? 1 : 0,
                      backgroundColor: t.palette.contrast_50,
                    },
                  ]}
                />
              ) : null}
              {bubble.text !== undefined ? (
                <View
                  style={[
                    isIncoming && a.ml_sm,
                    radii,
                    a.py_sm,
                    a.px_md,
                    {backgroundColor: bubbleColor},
                  ]}>
                  <Text
                    emoji
                    style={[
                      a.text_md,
                      a.leading_snug,
                      !isIncoming && {color: t.palette.white},
                    ]}>
                    {bubble.text}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    isIncoming && a.ml_sm,
                    radii,
                    a.py_sm,
                    a.px_md,
                    {
                      width: `${bubble.widthPct}%`,
                      backgroundColor: bubbleColor,
                    },
                  ]}>
                  <Text
                    emoji
                    style={[
                      a.text_md,
                      a.leading_snug,
                      !isIncoming && {color: t.palette.white},
                    ]}>
                    &nbsp;
                  </Text>
                </View>
              )}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

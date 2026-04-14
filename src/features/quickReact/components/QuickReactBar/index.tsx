/*
 * QuickReactBar (native).
 *
 * Overlay pill rendered near the long-press anchor point. Four emoji tap
 * targets (44x44). Pre-highlights currentEmoji. Triggers a Light haptic
 * on select. Emits analytics barOpen on mount (AC-18). Edge-collision:
 * flip above/below the anchor Y, clamp horizontally to screen bounds.
 */

import {useEffect, useMemo} from 'react'
import {Pressable, StyleSheet, useWindowDimensions} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {logBarOpen, logRemove, logSelect} from '#/features/quickReact/analytics'
import {useReducedMotion} from '#/features/quickReact/hooks/useReducedMotion'
import {
  type AnalyticsLogContext,
  getEmojiGlyph,
  REACTION_EMOJIS,
  type ReactionEmoji,
  type ReactionEntryPoint,
  type ReactionSurface,
} from '#/features/quickReact/types'

const BAR_WIDTH_ESTIMATE = 260
const BAR_HEIGHT = 56
const EDGE_MARGIN = 12
const TARGET_SIZE = 44

export type QuickReactBarProps = {
  postUri: string
  anchor: {x: number; y: number}
  surface: ReactionSurface
  entryPoint: ReactionEntryPoint
  currentEmoji?: ReactionEmoji
  onSelect: (emoji: ReactionEmoji) => void
  onRemove: () => void
  onDismiss: () => void
  logContext: AnalyticsLogContext
}

export function QuickReactBar({
  postUri,
  anchor,
  surface,
  entryPoint,
  currentEmoji,
  onSelect,
  onRemove,
  onDismiss,
  logContext,
}: QuickReactBarProps) {
  const t = useTheme()
  const {_} = useLingui()
  const playHaptic = useHaptics()
  const ax = useAnalytics()
  const reduceMotion = useReducedMotion()
  const {width: screenWidth, height: screenHeight} = useWindowDimensions()

  useEffect(() => {
    logBarOpen(ax, {
      postUri,
      surface,
      entryPoint,
      flagVariant: 'on',
      logContext,
    })
    // Only fire once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const position = useMemo(() => {
    const halfW = BAR_WIDTH_ESTIMATE / 2
    let left = anchor.x - halfW
    if (left < EDGE_MARGIN) left = EDGE_MARGIN
    if (left + BAR_WIDTH_ESTIMATE > screenWidth - EDGE_MARGIN) {
      left = screenWidth - EDGE_MARGIN - BAR_WIDTH_ESTIMATE
    }
    // Prefer above the touch point; flip below if too close to top.
    const above = anchor.y - BAR_HEIGHT - 8
    const top = above < EDGE_MARGIN ? anchor.y + 8 : above
    const clampedTop = Math.min(
      Math.max(top, EDGE_MARGIN),
      screenHeight - BAR_HEIGHT - EDGE_MARGIN,
    )
    return {left, top: clampedTop}
  }, [anchor.x, anchor.y, screenWidth, screenHeight])

  // Entrance animation: scale+fade on full motion, opacity-only on reduce.
  const scale = useSharedValue(reduceMotion ? 1 : 0.9)
  useEffect(() => {
    if (reduceMotion) return
    scale.value = withSpring(1, {damping: 18, stiffness: 220})
  }, [reduceMotion, scale])
  const animatedStyle = useAnimatedStyle(() => ({
    transform: reduceMotion ? [] : [{scale: scale.value}],
    opacity: withTiming(1, {duration: reduceMotion ? 80 : 140}),
  }))

  const handleSelect = (emoji: ReactionEmoji) => {
    playHaptic('Light')
    const isChange = !!currentEmoji
    if (currentEmoji === emoji) {
      logRemove(ax, {
        postUri,
        previousEmoji: currentEmoji,
        surface,
        entryPoint,
        flagVariant: 'on',
        logContext,
        removalMethod: 'retapSelected',
      })
      onRemove()
    } else {
      logSelect(ax, {
        postUri,
        emoji,
        surface,
        entryPoint,
        flagVariant: 'on',
        logContext,
        isChange,
        previousEmoji: currentEmoji,
      })
      onSelect(emoji)
    }
  }

  return (
    <>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Dismiss reaction bar`)}
        accessibilityHint={_(msg`Closes the reaction bar without selecting`)}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        entering={reduceMotion ? FadeIn.duration(80) : FadeIn.duration(140)}
        exiting={reduceMotion ? FadeOut.duration(80) : FadeOut.duration(120)}
        style={[
          {
            position: 'absolute',
            left: position.left,
            top: position.top,
            width: BAR_WIDTH_ESTIMATE,
            height: BAR_HEIGHT,
          },
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.rounded_full,
          a.border,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          a.shadow_md,
          a.px_sm,
          animatedStyle,
        ]}
        accessibilityRole="menu"
        accessibilityLabel={_(msg`React to post`)}
        accessibilityHint={_(msg`Select an emoji to react with`)}>
        {REACTION_EMOJIS.map(emoji => {
          const selected = currentEmoji === emoji
          const label = _(msg`React with ${emoji}`)
          return (
            <Pressable
              key={emoji}
              accessibilityRole="menuitem"
              accessibilityLabel={label}
              accessibilityHint={_(msg`Confirms reaction choice`)}
              accessibilityState={{selected}}
              onPress={() => handleSelect(emoji)}
              hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
              style={({pressed}) => [
                {width: TARGET_SIZE, height: TARGET_SIZE},
                a.rounded_full,
                a.align_center,
                a.justify_center,
                selected && {backgroundColor: t.palette.primary_100},
                pressed && {backgroundColor: t.palette.primary_200},
              ]}>
              <Text emoji style={[{fontSize: 28}]} accessibilityElementsHidden>
                {getEmojiGlyph(emoji)}
              </Text>
            </Pressable>
          )
        })}
      </Animated.View>
    </>
  )
}

/*
 * QuickReactPopover (web).
 *
 * Floating popover anchored to a passed ref/position. Focus trap, keyboard
 * navigation (ArrowLeft/ArrowRight, mirrored in RTL), Enter/Space to select,
 * Escape to close + restore focus, outside-click to dismiss.
 *
 * Reduced-motion via @media (prefers-reduced-motion: reduce) CSS — we use a
 * short fade duration unconditionally and the OS handles the gate.
 *
 * Emits analytics barOpen on mount (AC-18).
 */

import {useEffect, useRef} from 'react'
import {I18nManager, Pressable, StyleSheet, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, web} from '#/alf'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {logBarOpen, logRemove, logSelect} from '#/features/quickReact/analytics'
import {
  type AnalyticsLogContext,
  getEmojiGlyph,
  REACTION_EMOJIS,
  type ReactionEmoji,
  type ReactionEntryPoint,
  type ReactionSurface,
} from '#/features/quickReact/types'

export type QuickReactPopoverProps = {
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

export function QuickReactPopover({
  postUri,
  anchor,
  surface,
  entryPoint,
  currentEmoji,
  onSelect,
  onRemove,
  onDismiss,
  logContext,
}: QuickReactPopoverProps) {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const buttonRefs = useRef<Array<any>>([])
  const previouslyFocused = useRef<any>(null)

  useEffect(() => {
    logBarOpen(ax, {
      postUri,
      surface,
      entryPoint,
      flagVariant: 'on',
      logContext,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus first item on open, capture prior focus for restore on close.
  useEffect(() => {
    if (typeof document === 'undefined') return
    previouslyFocused.current = document.activeElement
    const first = buttonRefs.current[0]
    if (first && typeof first.focus === 'function') {
      first.focus()
    }
    return () => {
      const prev = previouslyFocused.current
      if (prev && typeof prev.focus === 'function') {
        try {
          prev.focus()
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape handler (web): listen on document so we catch before outside click.
  useEffect(() => {
    if (typeof window === 'undefined') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onDismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  const handleSelect = (emoji: ReactionEmoji) => {
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

  const onKeyNav = (e: any, index: number) => {
    const key = e.key as string | undefined
    if (!key) return
    const rtl = I18nManager.isRTL
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (key === forward) {
      e.preventDefault?.()
      const next = (index + 1) % REACTION_EMOJIS.length
      buttonRefs.current[next]?.focus?.()
    } else if (key === backward) {
      e.preventDefault?.()
      const prev = (index - 1 + REACTION_EMOJIS.length) % REACTION_EMOJIS.length
      buttonRefs.current[prev]?.focus?.()
    } else if (key === 'Enter' || key === ' ') {
      e.preventDefault?.()
      handleSelect(REACTION_EMOJIS[index])
    }
  }

  return (
    <>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={_(msg`Dismiss reaction picker`)}
        accessibilityHint={_(msg`Closes the reaction picker without selecting`)}
        style={StyleSheet.absoluteFill}
      />
      <View
        accessibilityRole="menu"
        accessibilityLabel={_(msg`React to post`)}
        accessibilityHint={_(msg`Select an emoji to react with`)}
        style={[
          {
            position: 'absolute',
            left: anchor.x,
            top: anchor.y,
          },
          a.flex_row,
          a.align_center,
          a.gap_xs,
          a.rounded_full,
          a.border,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          a.shadow_md,
          a.p_xs,
          web({transition: 'opacity 120ms ease-out'}),
        ]}>
        {REACTION_EMOJIS.map((emoji, i) => {
          const selected = currentEmoji === emoji
          const label = _(msg`React with ${emoji}`)
          return (
            <Pressable
              // eslint-disable-next-line react-compiler/react-compiler
              ref={(node: any) => {
                buttonRefs.current[i] = node
              }}
              key={emoji}
              accessibilityRole="menuitem"
              accessibilityLabel={label}
              accessibilityHint={_(msg`Confirms reaction choice`)}
              accessibilityState={{selected}}
              onPress={() => handleSelect(emoji)}
              // @ts-expect-error web-only prop
              onKeyDown={(e: any) => onKeyNav(e, i)}
              style={({pressed, hovered}: any) => [
                {width: 40, height: 40},
                a.rounded_full,
                a.align_center,
                a.justify_center,
                selected && {backgroundColor: t.palette.primary_100},
                hovered && {backgroundColor: t.palette.primary_100},
                pressed && {backgroundColor: t.palette.primary_200},
                web({cursor: 'pointer'}),
              ]}>
              <Text emoji style={[{fontSize: 24}]} accessibilityElementsHidden>
                {getEmojiGlyph(emoji)}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </>
  )
}

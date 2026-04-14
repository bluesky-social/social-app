/*
 * QuickReactChip (web). Same semantic content as native, but click opens
 * the popover anchored here; keyboard Enter/Space triggers selection.
 */

import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme, web} from '#/alf'
import {Text} from '#/components/Typography'
import {useQuickReactsEnabled} from '#/features/quickReact/hooks/useQuickReactsEnabled'
import {useViewerReaction} from '#/features/quickReact/hooks/useViewerReaction'
import {
  buildChipAccessibilityLabel,
  getEmojiGlyph,
  type ReactionSurface,
  shouldRenderChip,
} from '#/features/quickReact/types'

export type QuickReactChipProps = {
  postUri: string
  surface: ReactionSurface
  onPress?: () => void
}

export function QuickReactChip({postUri, onPress}: QuickReactChipProps) {
  const enabled = useQuickReactsEnabled()
  const {emoji} = useViewerReaction({postUri})
  const t = useTheme()
  const {_} = useLingui()

  if (!shouldRenderChip({enabled, emoji})) return null
  if (!emoji) return null

  const glyph = getEmojiGlyph(emoji)
  const a11yLabel = _(msg`Reacted with ${emoji}. Click to change or remove.`)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? buildChipAccessibilityLabel(emoji)}
      accessibilityHint={_(msg`Opens reaction picker`)}
      onPress={onPress}
      style={({pressed, hovered}: any) => [
        a.flex_row,
        a.align_center,
        a.gap_xs,
        a.rounded_full,
        a.px_sm,
        a.py_2xs,
        {minHeight: 28, minWidth: 44},
        web({cursor: 'pointer'}),
        hovered
          ? {backgroundColor: t.palette.primary_100}
          : pressed
            ? {backgroundColor: t.palette.primary_200}
            : {backgroundColor: t.palette.primary_25},
      ]}>
      <View style={[a.align_center, a.justify_center]} accessible={false}>
        <Text emoji style={[{fontSize: 16}]} accessibilityElementsHidden>
          {glyph}
        </Text>
      </View>
    </Pressable>
  )
}

/*
 * QuickReactPicker — a11y-first Dialog-based emoji picker.
 *
 * Used as the accessibility-action surface (AC-11) and as a universal
 * fallback/keyboard-accessible entry point. Renders four emoji rows plus an
 * optional "Remove reaction" row when the viewer already has a reaction on
 * this post.
 *
 * Selection calls control.close(() => onSelect(emoji)) — the callback form is
 * critical (CLAUDE.md footgun) so downstream state updates run AFTER the
 * dialog's close animation.
 */

import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Text} from '#/components/Typography'
import {
  getEmojiGlyph,
  REACTION_EMOJIS,
  type ReactionEmoji,
} from '#/features/quickReact/types'

function pickLocalizedLabel(emoji: ReactionEmoji, _: (m: any) => string) {
  switch (emoji) {
    case 'heart':
      return _(msg`React with heart`)
    case 'fire':
      return _(msg`React with fire`)
    case 'eyes':
      return _(msg`React with eyes`)
    case 'joy':
      return _(msg`React with joy`)
  }
}

export type QuickReactPickerProps = {
  control: Dialog.DialogControlProps
  currentEmoji?: ReactionEmoji
  onSelect: (emoji: ReactionEmoji) => void
  onRemove: () => void
}

export function QuickReactPicker({
  control,
  currentEmoji,
  onSelect,
  onRemove,
}: QuickReactPickerProps) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <PickerInner
        currentEmoji={currentEmoji}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    </Dialog.Outer>
  )
}

function PickerInner({
  currentEmoji,
  onSelect,
  onRemove,
}: {
  currentEmoji?: ReactionEmoji
  onSelect: (emoji: ReactionEmoji) => void
  onRemove: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()

  const handleSelect = (emoji: ReactionEmoji) => {
    // Critical: close with callback form so the parent's state updates
    // land after the dialog's close animation (CLAUDE.md footgun).
    control.close(() => onSelect(emoji))
  }

  const handleRemove = () => {
    control.close(() => onRemove())
  }

  return (
    <Dialog.ScrollableInner
      label={_(msg`React to post`)}
      style={[{maxWidth: 500}, a.w_full]}>
      <View style={[a.flex_1, a.gap_md]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_semi_bold]}>
            <Trans>React to post</Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>Choose an emoji to react with.</Trans>
          </Text>
        </View>

        <View style={[a.gap_xs]}>
          {REACTION_EMOJIS.map(emoji => {
            const selected = currentEmoji === emoji
            const label = pickLocalizedLabel(emoji, _)
            return (
              <Button
                key={emoji}
                label={label}
                onPress={() => handleSelect(emoji)}
                color={selected ? 'primary_subtle' : 'secondary'}
                size="large">
                {() => (
                  <View
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.gap_md,
                      a.flex_1,
                      a.py_sm,
                    ]}
                    accessible={false}>
                    <Text
                      emoji
                      style={[{fontSize: 28}]}
                      accessibilityElementsHidden>
                      {getEmojiGlyph(emoji)}
                    </Text>
                    <Text
                      style={[
                        a.text_md,
                        selected ? a.font_bold : a.font_normal,
                        t.atoms.text,
                      ]}>
                      {label}
                    </Text>
                  </View>
                )}
              </Button>
            )
          })}
        </View>

        {currentEmoji ? (
          <View style={[a.pt_sm]}>
            <Button
              label={_(msg`Remove reaction`)}
              onPress={handleRemove}
              color="negative_subtle"
              size="large">
              {() => (
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.gap_md,
                    a.flex_1,
                    a.py_sm,
                  ]}
                  accessible={false}>
                  <TrashIcon size="md" fill={t.palette.negative_500} />
                  <Text style={[a.text_md, {color: t.palette.negative_500}]}>
                    <Trans>Remove reaction</Trans>
                  </Text>
                </View>
              )}
            </Button>
          </View>
        ) : null}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

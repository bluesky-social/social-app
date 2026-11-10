import {useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import {MAX_PRONOUNS} from '#/lib/constants'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {CheckThick_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/TimesLarge'
import {Text} from '#/components/Typography'
import {IS_LIQUID_GLASS} from '#/env'
import {parsePronouns, togglePronoun} from './pronounSuggestions'

/**
 * The field's character count only appears from this many characters, so it
 * shows up as someone nears the limit rather than all the time.
 */
const SHOW_COUNT_FROM = 12

/**
 * Quick picks shown above the pronouns field. They only fill in the field, so
 * people can still type anything that fits.
 */
export const PRONOUN_SUGGESTIONS = [
  msg({
    message: 'she/her',
    comment:
      'Suggested pronouns in Edit Profile. Keep the “subject/object” shape if your language has one: picking several suggestions combines the part before the slash, e.g. “she/they”.',
  }),
  msg({
    message: 'he/him',
    comment:
      'Suggested pronouns in Edit Profile. Keep the “subject/object” shape if your language has one: picking several suggestions combines the part before the slash, e.g. “he/they”.',
  }),
  msg({
    message: 'they/them',
    comment:
      'Suggested pronouns in Edit Profile. Keep the “subject/object” shape if your language has one: picking several suggestions combines the part before the slash, e.g. “they/she”.',
  }),
]

/**
 * Adds, edits or removes the profile's pronouns. It only edits the Edit
 * Profile draft; the profile is written when that dialog saves.
 */
export function PronounsDialog({
  control,
  pronouns,
  onSave,
}: {
  control: Dialog.DialogControlProps
  pronouns: string
  /** Runs after the sheet closes, with the trimmed pronouns or "". */
  onSave: (pronouns: string) => void
}) {
  return (
    <Dialog.Outer
      control={control}
      webOptions={{alignCenter: true}}
      // same as the link sheet: keeps the title in view when the keyboard opens
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <PronounsDialogInner pronouns={pronouns} onSave={onSave} />
    </Dialog.Outer>
  )
}

function PronounsDialogInner({
  pronouns: initialPronouns,
  onSave,
}: {
  pronouns: string
  onSave: (pronouns: string) => void
}) {
  const control = Dialog.useDialogContext()
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const [pronouns, setPronouns] = useState(initialPronouns)

  const isEditing = !!initialPronouns
  // graphemes, to match the lexicon's maxGraphemes limit
  const length = countGraphemes(pronouns)
  const tooLong = length > MAX_PRONOUNS
  const suggestions = PRONOUN_SUGGESTIONS.map(s => i18n._(s))
  const picked = parsePronouns(pronouns, suggestions) ?? []

  const save = (next: string) => {
    if (tooLong) return
    control.close(() => onSave(next.trim()))
  }

  const closeInset = IS_LIQUID_GLASS ? tokens.space._2xl : tokens.space.xl

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 480})}
      label={isEditing ? l`Edit pronouns` : l`Add pronouns`}>
      <Button
        label={l`Close`}
        size="small"
        shape="round"
        color="secondary"
        onPress={() => control.close()}
        style={[a.absolute, a.z_10, {top: closeInset, right: closeInset}]}>
        <ButtonIcon icon={XIcon} />
      </Button>
      <View style={[a.gap_2xl, a.mt_sm]}>
        <View style={[a.gap_sm]}>
          <Text
            style={[
              a.text_2xl,
              a.font_bold,
              a.leading_tight,
              // clear of the close button
              {paddingRight: 48},
            ]}>
            {isEditing ? (
              <Trans>Edit pronouns</Trans>
            ) : (
              <Trans>Add pronouns</Trans>
            )}
          </Text>
          <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            <Trans>
              Your pronouns show next to your handle on your profile.
            </Trans>
          </Text>
        </View>

        <View style={[a.gap_md]}>
          {/* Pills first: most people pick one, and the field stays clear of the keyboard */}
          <View
            // several can be picked at once, e.g. she/they
            role="group"
            aria-label={l`Pronouns`}
            style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
            {suggestions.map((value, index) => {
              const selected = picked.includes(index)
              return (
                <Button
                  key={value}
                  role="checkbox"
                  aria-checked={selected}
                  label={value}
                  size="small"
                  color={selected ? 'secondary_inverted' : 'secondary'}
                  // 2pt less than the small size's 14 so the check sits closer to the edge
                  style={selected ? {paddingLeft: 12} : undefined}
                  onPress={() =>
                    setPronouns(togglePronoun(pronouns, index, suggestions))
                  }
                  testID={`profilePronouns-${index}`}>
                  {selected && <ButtonIcon icon={SmallCheckIcon} size="xs" />}
                  <ButtonText style={[!selected && t.atoms.text]}>
                    {value}
                  </ButtonText>
                </Button>
              )
            })}
          </View>
          <View>
            <TextField.Root isInvalid={tooLong}>
              <Dialog.Input
                testID="editProfilePronounsInput"
                label={l`Pronouns`}
                placeholder={l({
                  message: 'e.g. they/them',
                  comment: 'Example pronouns in the pronouns field',
                })}
                value={pronouns}
                onChangeText={setPronouns}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => save(pronouns)}
              />
              {length >= SHOW_COUNT_FROM && (
                <TextField.SuffixText
                  label={l`${length} out of ${MAX_PRONOUNS} characters`}
                  style={[
                    a.text_sm,
                    tooLong
                      ? {color: t.palette.negative_400}
                      : t.atoms.text_contrast_low,
                    {paddingRight: 0},
                  ]}>
                  {length}/{MAX_PRONOUNS}
                </TextField.SuffixText>
              )}
            </TextField.Root>
            {tooLong && (
              <Text
                style={[
                  a.text_sm,
                  a.mt_xs,
                  a.font_semi_bold,
                  {color: t.palette.negative_400},
                ]}>
                <Plural
                  value={MAX_PRONOUNS}
                  other="Pronouns can be up to # characters."
                />
              </Text>
            )}
          </View>
        </View>

        <View style={[a.gap_sm]}>
          <Button
            testID="editProfilePronounsDoneBtn"
            label={l`Done`}
            onPress={() => save(pronouns)}
            disabled={tooLong}
            size="large"
            color="primary"
            style={[tooLong && {opacity: 0.5}]}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
          {isEditing && (
            <Button
              testID="editProfilePronounsRemoveBtn"
              label={l`Remove pronouns`}
              onPress={() => control.close(() => onSave(''))}
              size="large"
              color="secondary">
              <ButtonText>
                <Trans>Remove pronouns</Trans>
              </ButtonText>
            </Button>
          )}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}

/**
 * Icon sizes come in fixed steps (8, 12, 16...), so this draws the check at
 * 10pt, centered in the space ButtonIcon gives it.
 */
function SmallCheckIcon({width, ...props}: SVGIconProps) {
  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        {width: Number(width), height: Number(width)},
      ]}>
      <CheckIcon {...props} width={10} />
    </View>
  )
}

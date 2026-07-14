import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import {type AutocompleteItem, useAutocomplete} from '#/components/Autocomplete'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as ProfileCard from '#/components/ProfileCard'
import {useRecentSearchesSource} from '#/features/searchHistory/useRecentSearchesSource'
import {
  appendSelection,
  type AutocompleteInputProps,
  lastTokenOf,
} from './shared'

/**
 * Native: Sift's popover positioning doesn't anchor, so the result list is
 * drawn as an absolutely-positioned overlay directly above the input. Anchoring
 * above (rather than below) keeps it clear of the on-screen keyboard, and
 * overlaying (rather than rendering inline) means it doesn't push the focused
 * input down under the keyboard. See index.tsx for the web (floating) variant.
 * The typeahead matches the last space-delimited token; selecting a result
 * completes that token and leaves a trailing space so the next value can be
 * typed.
 */
export function AutocompleteInput({
  label,
  value,
  placeholder,
  onChangeText,
  onSubmitEditing,
}: AutocompleteInputProps) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [focused, setFocused] = useState(false)

  const lastToken = lastTokenOf(value)
  const recents = useRecentSearchesSource({profilesOnly: true})
  const {items} = useAutocomplete({
    type: 'profile',
    query: lastToken,
    sources: [recents],
  })

  const showDropdown = focused && lastToken.length > 0 && items.length > 0

  function selectItem(item: AutocompleteItem) {
    const next = appendSelection(value, lastToken, item)
    if (next !== null) onChangeText(next)
  }

  return (
    <View style={[a.relative]}>
      <TextField.Root>
        <Dialog.Input
          label={label}
          value={value}
          placeholder={placeholder}
          keyboardAppearance={t.scheme}
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          style={[a.pr_2xl]}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
        />
      </TextField.Root>

      {value.length > 0 && (
        <View
          style={[a.absolute, a.justify_center, {top: 0, bottom: 0, right: 8}]}>
          <Button
            label={l`Clear`}
            onPress={() => onChangeText('')}
            size="tiny"
            color="secondary"
            shape="round">
            <ButtonIcon icon={XIcon} />
          </Button>
        </View>
      )}

      {showDropdown && <OverlayList items={items} onSelect={selectItem} />}
    </View>
  )
}

function OverlayList({
  items,
  onSelect,
}: {
  items: AutocompleteItem[]
  onSelect: (item: AutocompleteItem) => void
}) {
  const t = useTheme()
  const moderationOpts = useModerationOpts()

  if (!moderationOpts) return null

  /*
   * The list sits above the input, so reverse it to put the most relevant
   * result (first) at the bottom, nearest the text the user is typing.
   */
  const ordered = [...items].reverse()

  return (
    <View
      style={[
        /*
         * Drawn as an overlay anchored just above the input so it doesn't push
         * the input down under the keyboard. z_10 keeps it above sibling rows.
         */
        a.absolute,
        a.z_10,
        a.mb_xs,
        {left: 0, right: 0, bottom: '100%'},
        a.border,
        a.rounded_sm,
        a.overflow_hidden,
        t.atoms.border_contrast_low,
        t.atoms.bg,
      ]}>
      {ordered.map((item, index) => {
        if (item.type !== 'profile') return null
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            onPress={() => onSelect(item)}
            style={({pressed}) => [
              a.py_sm,
              a.px_md,
              index !== 0 && a.border_t,
              t.atoms.border_contrast_low,
              pressed && t.atoms.bg_contrast_25,
            ]}>
            <ProfileCard.Header>
              <ProfileCard.Avatar
                disabledPreview
                profile={item.profile}
                moderationOpts={moderationOpts}
              />
              <ProfileCard.NameAndHandle
                profile={item.profile}
                moderationOpts={moderationOpts}
              />
            </ProfileCard.Header>
          </Pressable>
        )
      })}
    </View>
  )
}

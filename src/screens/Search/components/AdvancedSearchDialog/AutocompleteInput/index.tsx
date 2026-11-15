import {useEffect, useState} from 'react'
import {View} from 'react-native'
import {useSift} from '@bsky.app/sift'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {
  Autocomplete,
  AutocompleteItemProfile,
  useAutocomplete,
} from '#/components/Autocomplete'
import {type AutocompleteItemProps} from '#/components/Autocomplete/types'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {
  appendSelection,
  type AutocompleteInputProps,
  lastTokenOf,
} from './shared'

function renderItem(props: AutocompleteItemProps) {
  return <AutocompleteItemProfile {...props} />
}

/**
 * Web: the result list floats above content via the shared Autocomplete/Sift
 * primitives (the same stack the composer/DM mention typeahead uses). See
 * index.native.tsx for the inline variant. The typeahead matches the last
 * space-delimited token; selecting a result completes that token and leaves a
 * trailing space so the next value can be typed.
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
  /*
   * The popover is portaled and doesn't follow the page as it scrolls, so hide
   * it on scroll. Reset when the user edits or refocuses the input.
   */
  const [dismissedByScroll, setDismissedByScroll] = useState(false)

  const sift = useSift({
    offset: a.p_xs.padding,
    placement: 'bottom-start',
    dynamicWidth: true,
  })

  const lastToken = lastTokenOf(value)
  const {items} = useAutocomplete({type: 'profile', query: lastToken})

  const showDropdown =
    focused && !dismissedByScroll && lastToken.length > 0 && items.length > 0

  useEffect(() => {
    if (!showDropdown) return
    const onScroll = () => setDismissedByScroll(true)
    /*
     * Capture phase so scrolls inside the dialog's scroll container (not just
     * the window) trigger dismissal.
     */
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [showDropdown])

  /*
   * The anchor ref is applied via inputRef (lands on the inner TextInput); the
   * remaining combobox a11y props are spread onto the input.
   */
  const {ref: anchorRef, ...comboboxProps} = sift.targetProps

  return (
    <View style={[a.relative]}>
      <TextField.Root>
        <Dialog.Input
          {...comboboxProps}
          inputRef={anchorRef}
          label={label}
          value={value}
          placeholder={placeholder}
          keyboardAppearance={t.scheme}
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          style={[a.pr_2xl]}
          onChangeText={text => {
            setDismissedByScroll(false)
            onChangeText(text)
          }}
          onFocus={() => {
            setDismissedByScroll(false)
            setFocused(true)
          }}
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

      {showDropdown && (
        <Autocomplete
          sift={sift}
          data={items}
          render={renderItem}
          onSelect={item => {
            const next = appendSelection(value, lastToken, item)
            if (next !== null) onChangeText(next)
          }}
          onDismiss={() => {}}
        />
      )}
    </View>
  )
}

import {type Ref} from 'react'
import {type TextInput, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, native, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {ArrowLeft_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass'
import {IS_WEB} from '#/env'
import {
  GIF_AUTOCOMPLETE_LISTBOX_ID,
  GifAutocompleteSuggestions,
  suggestionItemId,
} from '#/features/gifPicker/components/GifAutocompleteSuggestions'
import {type GifAutocompleteState} from '#/features/gifPicker/hooks/useGifAutocomplete'

export function GifPickerHeader({
  inputRef,
  onChangeText,
  onClose,
  onEscape,
  autocomplete,
}: {
  inputRef: Ref<TextInput>
  onChangeText: (text: string) => void
  onClose: () => void
  onEscape: () => void
  autocomplete: GifAutocompleteState
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  return (
    <View style={[native(a.pt_4xl), a.relative, a.mb_lg, a.pb_sm, t.atoms.bg]}>
      <View style={[a.flex_row, a.align_center, !gtMobile && web(a.gap_md)]}>
        {!gtMobile && IS_WEB && (
          <Button
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={onClose}
            label={_(msg`Close GIF dialog`)}>
            <ButtonIcon icon={Arrow} size="md" />
          </Button>
        )}

        <TextField.Root style={[!gtMobile && IS_WEB && a.flex_1]}>
          <TextField.Icon icon={Search} />
          <TextField.Input
            label={_(msg`Search GIFs`)}
            placeholder={_(msg`Search GIFs`)}
            onChangeText={onChangeText}
            returnKeyType="search"
            clearButtonMode="while-editing"
            inputRef={inputRef}
            maxLength={50}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key === 'Escape') {
                if (!autocomplete.handleKeyDown('Escape')) {
                  onEscape()
                }
              } else {
                autocomplete.handleKeyDown(nativeEvent.key)
              }
            }}
            // @ts-ignore web-only ARIA props
            role={autocomplete.isVisible ? 'combobox' : undefined}
            aria-controls={
              autocomplete.isVisible ? GIF_AUTOCOMPLETE_LISTBOX_ID : undefined
            }
            aria-expanded={autocomplete.isVisible}
            aria-autocomplete={autocomplete.isVisible ? 'list' : undefined}
            aria-activedescendant={
              autocomplete.isVisible && autocomplete.activeIndex >= 0
                ? suggestionItemId(autocomplete.activeIndex)
                : undefined
            }
          />
        </TextField.Root>
      </View>

      {autocomplete.isVisible && (
        <GifAutocompleteSuggestions
          suggestions={autocomplete.suggestions}
          activeIndex={autocomplete.activeIndex}
          onSelect={autocomplete.selectSuggestion}
        />
      )}
    </View>
  )
}

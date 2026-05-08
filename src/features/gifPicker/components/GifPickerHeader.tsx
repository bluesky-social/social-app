import {type Ref} from 'react'
import {type TextInput, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

export function GifPickerHeader({
  inputRef,
  onChangeText,
  onClear,
  onEscape,
  canClear,
}: {
  inputRef: Ref<TextInput>
  onChangeText: (text: string) => void
  onClear: () => void
  onEscape: () => void
  canClear: boolean
}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <View
      style={[
        native(a.pt_4xl),
        a.relative,
        a.pb_md,
        a.flex_row,
        a.align_center,
        t.atoms.bg,
      ]}>
      <TextField.Root style={a.flex_1}>
        <TextField.Icon icon={Search} />
        <TextField.Input
          label={l({
            message: 'Search GIFs',
            comment:
              'Accessibility label for the GIF search input inside the GIF picker dialog.',
          })}
          placeholder={l({
            message: 'Search KLIPY',
            comment:
              'Placeholder text inside the GIF search input. KLIPY is the third-party GIF provider; keep the brand name as-is.',
          })}
          onChangeText={onChangeText}
          returnKeyType="search"
          inputRef={inputRef}
          maxLength={50}
          onKeyPress={({nativeEvent}) => {
            if (nativeEvent.key === 'Escape') {
              onEscape()
            }
          }}
        />
        {canClear && (
          <Button
            size="tiny"
            color="secondary"
            shape="round"
            style={a.z_30}
            onPress={onClear}
            label={l({
              message: 'Clear GIF search',
              comment:
                'Accessibility label for the X button inside the search input that clears the typed query and returns to the trending feed.',
            })}>
            <ButtonIcon icon={X} size="sm" />
          </Button>
        )}
      </TextField.Root>
    </View>
  )
}

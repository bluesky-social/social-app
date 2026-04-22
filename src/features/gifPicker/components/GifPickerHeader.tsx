import {type Ref} from 'react'
import {type TextInput, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, native, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {ArrowLeft_Stroke2_Corner0_Rounded as Arrow} from '#/components/icons/Arrow'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass'
import {IS_WEB} from '#/env'

export function GifPickerHeader({
  inputRef,
  onChangeText,
  onGoBack,
  onEscape,
}: {
  inputRef: Ref<TextInput>
  onChangeText: (text: string) => void
  onGoBack: () => void
  onEscape: () => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  return (
    <View
      style={[
        native(a.pt_4xl),
        a.relative,
        a.pb_md,
        a.flex_row,
        a.align_center,
        !gtMobile && web(a.gap_md),
        t.atoms.bg,
      ]}>
      {!gtMobile && IS_WEB && (
        <Button
          size="small"
          color="secondary"
          shape="round"
          onPress={onGoBack}
          label={l`Go back`}>
          <ButtonIcon icon={Arrow} size="md" />
        </Button>
      )}

      <TextField.Root style={[!gtMobile && IS_WEB && a.flex_1]}>
        <TextField.Icon icon={Search} />
        <TextField.Input
          label={l`Search GIFs`}
          placeholder={l`Search GIFs`}
          onChangeText={onChangeText}
          returnKeyType="search"
          clearButtonMode="while-editing"
          inputRef={inputRef}
          maxLength={50}
          onKeyPress={({nativeEvent}) => {
            if (nativeEvent.key === 'Escape') {
              onEscape()
            }
          }}
        />
      </TextField.Root>
    </View>
  )
}

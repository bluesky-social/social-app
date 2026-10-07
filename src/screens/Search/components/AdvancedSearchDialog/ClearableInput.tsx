import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'

/**
 * A text input with a clear (X) button inside it on the right.
 */
export function ClearableInput({
  label,
  value,
  placeholder,
  onChangeText,
  onSubmitEditing,
}: {
  label: string
  value: string
  placeholder?: string
  onChangeText: (text: string) => void
  onSubmitEditing?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

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
    </View>
  )
}

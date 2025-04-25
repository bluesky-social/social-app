import {View, TextInputProps} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as TextField from '#/components/forms/TextField'
import {Shield_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'

export function normalizeCode(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z2-7]/g, '')
  if (normalized.length <= 5) return normalized
  return `${normalized.slice(0, 5)}-${normalized.slice(5, 10)}`
}

export function TokenField({
  value,
  onChangeText,
}: Pick<TextInputProps, 'value' | 'onChangeText' | 'onSubmitEditing'>) {
  const {_} = useLingui()

  const handleOnChangeText = (v: string) => {
    onChangeText?.(normalizeCode(v))
  }

  return (
    <View>
      <TextField.Root>
        <TextField.Icon icon={Shield} />
        <TextField.Input
          label={_(msg`Confirmation code`)}
          placeholder="XXXXX-XXXXX"
          value={value}
          onChangeText={handleOnChangeText}
        />
      </TextField.Root>
    </View>
  )
}

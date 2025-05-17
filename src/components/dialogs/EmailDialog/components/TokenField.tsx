import {type TextInputProps, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as TextField from '#/components/forms/TextField'
import {Shield_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'

export function normalizeCode(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z2-7]/g, '')
  if (normalized.length <= 5) return normalized
  return `${normalized.slice(0, 5)}-${normalized.slice(5)}`
}

export function isValidCode(value?: string) {
  return Boolean(value && /^[A-Z2-7]{5}-[A-Z2-7]{5}$/.test(value))
}

export function TokenField({
  value,
  onChangeText,
  onSubmitEditing,
}: Pick<TextInputProps, 'value' | 'onChangeText' | 'onSubmitEditing'>) {
  const {_} = useLingui()
  const isInvalid = Boolean(value && value.length > 10 && !isValidCode(value))

  const handleOnChangeText = (v: string) => {
    onChangeText?.(normalizeCode(v))
  }

  return (
    <View>
      <TextField.Root>
        <TextField.Icon icon={Shield} />
        <TextField.Input
          isInvalid={isInvalid}
          label={_(msg`Confirmation code`)}
          placeholder="XXXXX-XXXXX"
          value={value}
          onChangeText={handleOnChangeText}
          onSubmitEditing={onSubmitEditing}
        />
      </TextField.Root>
    </View>
  )
}

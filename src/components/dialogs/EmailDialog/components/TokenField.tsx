import {type TextInputProps, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import * as TextField from '#/components/forms/TextField'
import {Shield_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'

/**
 * Codes are base32 (A-Z and 2-7), so the digits 0 and 1 never appear in one.
 * People read them off the letters O and I, though, so map them back rather
 * than silently dropping the keypress.
 */
export function normalizeCode(value: string) {
  const normalized = value
    .toUpperCase()
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/[^A-Z2-7]/g, '')
  if (normalized.length < 5) return normalized
  if (normalized.length === 5) {
    // keep the hyphen if the user typed it themselves
    return value.endsWith('-') ? `${normalized}-` : normalized
  }
  return `${normalized.slice(0, 5)}-${normalized.slice(5)}`
}

export function isValidCode(value?: string) {
  return Boolean(value && /^[A-Z2-7]{5}-[A-Z2-7]{5}$/.test(value))
}

export function TokenField({
  testID,
  autoFocus,
  autoComplete = 'off',
  returnKeyType,
  blurOnSubmit,
  accessibilityHint,
  editable,
  isInvalid = false,
  value,
  onChangeText,
  onFocus,
  onSubmitEditing,
}: {
  isInvalid?: boolean
} & Pick<
  TextInputProps,
  | 'testID'
  | 'autoFocus'
  | 'autoComplete'
  | 'returnKeyType'
  | 'blurOnSubmit'
  | 'accessibilityHint'
  | 'editable'
  | 'value'
  | 'onChangeText'
  | 'onFocus'
  | 'onSubmitEditing'
>) {
  const {t: l} = useLingui()
  const isFormatInvalid = Boolean(
    value && value.length > 10 && !isValidCode(value),
  )

  const handleOnChangeText = (v: string) => {
    onChangeText?.(normalizeCode(v))
  }

  return (
    <View>
      <TextField.Root>
        <TextField.Icon icon={Shield} />
        <TextField.Input
          testID={testID}
          accessibilityHint={accessibilityHint}
          autoComplete={autoComplete}
          autoCorrect={false}
          autoFocus={autoFocus}
          blurOnSubmit={blurOnSubmit}
          editable={editable}
          isInvalid={isInvalid || isFormatInvalid}
          label={l`Confirmation code`}
          maxLength={11}
          placeholder="XXXXX-XXXXX"
          returnKeyType={returnKeyType}
          value={value}
          onChangeText={handleOnChangeText}
          onFocus={onFocus}
          onSubmitEditing={onSubmitEditing}
        />
      </TextField.Root>
    </View>
  )
}

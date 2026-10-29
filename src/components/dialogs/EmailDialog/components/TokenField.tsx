import {type TextInputProps, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import * as TextField from '#/components/forms/TextField'
import {Shield_Stroke2_Corner0_Rounded as Shield} from '#/components/icons/Shield'
import {IS_ANDROID} from '#/env'

/**
 * Uppercase letters and preserve digits and supplied hyphens without imposing
 * a code format. The hosting provider determines which format is valid.
 */
export function normalizeCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

export function isValidCode(value?: string) {
  return Boolean(value && /^[A-Z0-9]{5}-[A-Z0-9]{5}$/i.test(value))
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
          autoCapitalize="characters"
          autoComplete={autoComplete}
          autoCorrect={false}
          spellCheck={false}
          keyboardType={IS_ANDROID ? 'visible-password' : 'ascii-capable'}
          autoFocus={autoFocus}
          blurOnSubmit={blurOnSubmit}
          editable={editable}
          isInvalid={isInvalid}
          label={l`Confirmation code`}
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

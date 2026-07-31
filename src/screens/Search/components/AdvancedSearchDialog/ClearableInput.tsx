import {useRef, useState} from 'react'
import {type TextInput, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'

/**
 * A text input with a clear (X) button inside it on the right. The input stays
 * uncontrolled (defaultValue + imperative clear) per the codebase's preference;
 * local state only drives whether the clear button is shown.
 */
export function ClearableInput({
  label,
  defaultValue,
  placeholder,
  onChangeText,
  onSubmitEditing,
}: {
  label: string
  defaultValue: string
  placeholder?: string
  onChangeText: (text: string) => void
  onSubmitEditing?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const inputRef = useRef<TextInput>(null)
  const [showClear, setShowClear] = useState(defaultValue.length > 0)

  return (
    <View style={[a.relative]}>
      <TextField.Root>
        <Dialog.Input
          inputRef={inputRef}
          label={label}
          defaultValue={defaultValue}
          placeholder={placeholder}
          keyboardAppearance={t.scheme}
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          style={[a.pr_2xl]}
          onChangeText={text => {
            setShowClear(text.length > 0)
            onChangeText(text)
          }}
          onSubmitEditing={onSubmitEditing}
        />
      </TextField.Root>

      {showClear && (
        <View
          style={[a.absolute, a.justify_center, {top: 0, bottom: 0, right: 8}]}>
          <Button
            label={l`Clear`}
            onPress={() => {
              inputRef.current?.clear()
              setShowClear(false)
              onChangeText('')
            }}
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

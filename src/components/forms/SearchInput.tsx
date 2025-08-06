import {
  type NativeSyntheticEvent,
  type TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {IS_NATIVE} from '#/env'

type SearchInputProps = Omit<TextField.InputProps, 'label'> & {
  ref?: React.Ref<TextInput>
  label?: TextField.InputProps['label']
  /**
   * Called when the user presses the (X) button
   */
  onClearText?: () => void
  /**
   * Called when the user presses the Escape key
   */
  onEscape?: () => void
}

export function SearchInput({
  ref,
  value,
  label,
  onClearText,
  onEscape,
  ...rest
}: SearchInputProps) {
  const t = useTheme()
  const {_} = useLingui()
  const showClear = value && value.length > 0

  const onKeyPress = (
    evt: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (evt.nativeEvent.key === 'Escape') {
      onEscape?.()
    }
  }

  return (
    <View style={[a.w_full, a.relative]}>
      <TextField.Root>
        <TextField.Icon icon={MagnifyingGlassIcon} />
        <TextField.Input
          inputRef={ref}
          label={label || _(msg`Search`)}
          value={value}
          placeholder={_(msg`Search`)}
          returnKeyType="search"
          keyboardAppearance={t.scheme}
          selectTextOnFocus={IS_NATIVE}
          autoFocus={false}
          accessibilityRole="search"
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          onKeyPress={onKeyPress}
          style={[
            showClear
              ? {
                  paddingRight: 24,
                }
              : {},
          ]}
          {...rest}
        />
      </TextField.Root>

      {showClear && (
        <View
          style={[
            a.absolute,
            a.z_20,
            a.my_auto,
            a.inset_0,
            a.justify_center,
            a.pr_sm,
            {left: 'auto'},
          ]}>
          <Button
            testID="searchTextInputClearBtn"
            onPress={onClearText}
            label={_(msg`Clear search query`)}
            hitSlop={HITSLOP_10}
            size="tiny"
            shape="round"
            variant="ghost"
            color="secondary">
            <ButtonIcon icon={X} size="xs" />
          </Button>
        </View>
      )}
    </View>
  )
}

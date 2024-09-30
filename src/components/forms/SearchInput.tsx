import React from 'react'
import {TextInput, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass2'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

type SearchInputProps = Omit<TextField.InputProps, 'label'> & {
  label?: TextField.InputProps['label']
  /**
   * Called when the user presses the (X) button
   */
  onClearText?: () => void
  /**
   * @deprecated use `value`
   */
  query?: string
  /**
   * @deprecated use `onFocus`
   */
  setIsInputFocused?: (v: boolean) => void
  /**
   * @deprecated use `onChangeText`
   */
  onChangeQuery?: (v: string) => void
  /**
   * @deprecated use `onClearText`
   */
  onPressCancelSearch?: () => void
  /**
   * @deprecated use `onSubmitEditing`
   */
  onSubmitQuery?: () => void
}

export const SearchInput = React.forwardRef<TextInput, SearchInputProps>(
  function SearchInput(
    {
      query,
      setIsInputFocused,
      onChangeQuery,
      onPressCancelSearch,
      onSubmitQuery,
      value,
      label,
      onClearText,
      ...rest
    },
    ref,
  ) {
    const t = useTheme()
    const {_} = useLingui()
    const q = value || query || ''

    return (
      <View style={[a.w_full, a.relative]}>
        <TextField.Root>
          <TextField.Icon icon={MagnifyingGlassIcon} />
          <TextField.Input
            inputRef={ref}
            label={label || _(msg`Search`)}
            value={q}
            placeholder={_(msg`Search`)}
            returnKeyType="search"
            onChangeText={onChangeQuery}
            onSubmitEditing={onSubmitQuery}
            onFocus={() => setIsInputFocused?.(true)}
            onBlur={() => setIsInputFocused?.(false)}
            keyboardAppearance={t.scheme}
            selectTextOnFocus={isNative}
            autoFocus={false}
            accessibilityRole="search"
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
            {...rest}
          />
        </TextField.Root>

        {q.length > 0 && (
          <View
            style={[
              a.absolute,
              a.z_10,
              a.my_auto,
              a.inset_0,
              a.justify_center,
              a.pr_sm,
              {left: 'auto'},
            ]}>
            <Button
              testID="searchTextInputClearBtn"
              onPress={onClearText || onPressCancelSearch}
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
  },
)

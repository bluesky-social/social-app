import React from 'react'
import {StyleProp, TextInput, View, ViewStyle} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass2'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

interface Props {
  query: string
  setIsInputFocused?: (v: boolean) => void
  onChangeQuery: (v: string) => void
  onPressCancelSearch: () => void
  onSubmitQuery: () => void
  style?: StyleProp<ViewStyle>
}

export interface SearchInputRef {
  focus?: () => void
}

export const SearchInput = React.forwardRef<SearchInputRef, Props>(
  function SearchInput(
    {
      query,
      setIsInputFocused,
      onChangeQuery,
      onPressCancelSearch,
      onSubmitQuery,
      style,
    },
    ref,
  ) {
    const t = useTheme()
    const {_} = useLingui()
    const textInputRef = React.useRef<TextInput>(null)

    React.useImperativeHandle(ref, () => ({
      focus: () => textInputRef.current?.focus(),
      blur: () => textInputRef.current?.blur(),
    }))

    return (
      <View style={[a.flex_1, a.relative, style]}>
        <TextField.Root>
          <TextField.Icon icon={MagnifyingGlassIcon} />
          <TextField.Input
            inputRef={textInputRef}
            label={_(msg`Search`)}
            value={query}
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
          />
        </TextField.Root>

        {query.length > 0 && (
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
              onPress={onPressCancelSearch}
              label={_(msg`Clear search query`)}
              hitSlop={HITSLOP_10}
              size="tiny"
              shape="round"
              variant="ghost"
              color="secondary">
              <ButtonIcon icon={X} size="sm" />
            </Button>
          </View>
        )}
      </View>
    )
  },
)

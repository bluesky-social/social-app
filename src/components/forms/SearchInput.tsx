import React from 'react'
import {Pressable, TextInput, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {isNative} from '#/platform/detection'
import {atoms as a, native, useTheme, web} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass2'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

type SearchInputProps = Omit<TextField.InputProps, 'label'> & {
  label?: TextField.InputProps['label']
  /**
   * Called when the user presses the (X) button
   */
  onClearText?: () => void
}

export const SearchInput = React.forwardRef<TextInput, SearchInputProps>(
  function SearchInput({value, label, onClearText, ...rest}, ref) {
    const t = useTheme()
    const {_} = useLingui()

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
            selectTextOnFocus={isNative}
            autoFocus={false}
            accessibilityRole="search"
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
            {...rest}
          />
          {value && value.length > 0 && (
            <Pressable
              testID="searchTextInputClearBtn"
              onPress={onClearText}
              accessibilityLabel={_(msg`Clear search query`)}
              accessibilityHint={undefined}
              hitSlop={HITSLOP_10}
              style={[
                a.rounded_full,
                a.align_center,
                a.justify_center,
                native(a.ml_xs),
                web(a.ml_sm),
                a.z_20,
                {width: 20, height: 20},
                t.name === 'light'
                  ? {backgroundColor: 'rgba(0, 0, 0, 0.1)'}
                  : {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
              ]}>
              <X
                style={[t.atoms.text_contrast_medium]}
                width={14}
                height={14}
              />
            </Pressable>
          )}
        </TextField.Root>
      </View>
    )
  },
)

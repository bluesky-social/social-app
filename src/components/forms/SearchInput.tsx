import React, {useRef, useState} from 'react'
import {TextInput, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {mergeRefs} from '#/lib/merge-refs'
import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass2'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'

type SearchInputProps = Omit<TextField.InputProps, 'label'> & {
  label?: TextField.InputProps['label']
  onClearText?: () => void
}

export const SearchInput = React.forwardRef<TextInput, SearchInputProps>(
  function SearchInput({label, onChangeText: onChangeTextProp, ...rest}, ref) {
    const t = useTheme()
    const {_} = useLingui()
    const [showClear, setShowClear] = useState(false)
    const inputRef = useRef<TextInput>()

    const handleChangeText = (text: string) => {
      setShowClear(text.length > 0)
      onChangeTextProp?.(text)
    }

    const handleClear = () => {
      inputRef.current?.clear()
      setShowClear(false)
      onChangeTextProp?.('')
    }

    return (
      <View style={[a.w_full, a.relative]}>
        <TextField.Root>
          <TextField.Icon icon={MagnifyingGlassIcon} />
          <TextField.Input
            inputRef={mergeRefs([ref, inputRef])}
            onChangeText={handleChangeText}
            label={label || _(msg`Search`)}
            placeholder={_(msg`Search`)}
            returnKeyType="search"
            keyboardAppearance={t.scheme}
            selectTextOnFocus={isNative}
            autoFocus={false}
            accessibilityRole="search"
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
            style={[showClear && {paddingRight: 24}]}
            {...rest}
          />
        </TextField.Root>

        {showClear && (
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
              onPress={handleClear}
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

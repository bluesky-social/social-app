import React from 'react'
import {View, TextStyle} from 'react-native'
// @ts-ignore
import {unstable_createElement} from 'react-native-web'

import {Logo} from '#/view/icons/Logo'
import {useTheme, atoms, tokens} from '#/alf'
import {Text} from '#/view/com/Typography'
import {useInteractionState} from '#/view/com/util/hooks/useInteractionState'

import {InputDateProps} from '#/view/com/forms/InputDate/types'
import {toSimpleDateString} from '#/view/com/forms/InputDate/utils'

export * as utils from '#/view/com/forms/InputDate/utils'

export function InputDate({
  label,
  hasError,
  testID,
  value: initialValue,
  onChange,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: InputDateProps) {
  const labelId = React.useId()
  const t = useTheme()
  const [value, setValue] = React.useState<string>(initialValue)
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  const {inputStyles, iconStyles} = React.useMemo(() => {
    const input: TextStyle[] = [
      {
        paddingLeft: 40,
      },
    ]
    const icon: TextStyle[] = []

    if (hasError) {
      input.push({
        borderColor: tokens.color.red_200,
      })
      icon.push({
        color: tokens.color.red_400,
      })
    }

    if (hovered || focused) {
      input.push({
        borderColor: t.atoms.border_contrast_500.borderColor,
      })

      if (hasError) {
        input.push({
          borderColor: tokens.color.red_500,
        })
      }
    }

    return {inputStyles: input, iconStyles: icon}
  }, [t, hovered, focused, hasError])

  const handleOnChange = React.useCallback(
    (e: any) => {
      const date = e.currentTarget.valueAsDate

      if (date) {
        const formatted = toSimpleDateString(date)
        onChange(formatted)
        setValue(formatted)
      }
    },
    [onChange, setValue],
  )

  return (
    <View style={[atoms.relative, atoms.w_full]}>
      {label && (
        <Text
          nativeID={labelId}
          style={[
            atoms.text_sm,
            atoms.font_bold,
            t.atoms.text_contrast_600,
            atoms.mb_sm,
          ]}>
          {label}
        </Text>
      )}

      {unstable_createElement('input', {
        ...props,
        testID: `${testID}-datepicker`,
        'aria-labelledby': labelId,
        'aria-label': label,
        accessibilityLabel: accessibilityLabel,
        accessibilityHint: accessibilityHint,
        type: 'date',
        value: value,
        onFocus: onFocus,
        onBlur: onBlur,
        onChange: handleOnChange,
        onMouseEnter: onHoverIn,
        onMouseLeave: onHoverOut,
        style: [
          {
            outline: 0,
            border: 0,
            appearance: 'none',
            boxSizing: 'border-box',
            lineHeight: atoms.text_md.lineHeight * 1.1875,
            paddingTop: atoms.pt_md.paddingTop - 1,
          },
          atoms.w_full,
          atoms.px_lg,
          atoms.pb_md,
          atoms.rounded_sm,
          atoms.text_md,
          t.atoms.bg_contrast_100,
          t.atoms.text,
          ...inputStyles,
        ],
      })}

      <View
        style={[
          atoms.absolute,
          atoms.inset_0,
          atoms.align_center,
          atoms.justify_center,
          atoms.pl_md,
          {right: 'auto'},
        ]}>
        <Logo
          style={[
            {color: t.atoms.border_contrast_500.borderColor},
            {
              width: 20,
              pointerEvents: 'none',
            },
            ...iconStyles,
          ]}
        />
      </View>
    </View>
  )
}

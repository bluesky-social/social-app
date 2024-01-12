import React from 'react'
import {
  View,
  TextInput,
  TextInputProps,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native'

import {useTheme, atoms, web, tokens} from '#/alf'
import {Text} from '#/view/com/Typography'
import {useInteractionState} from '#/view/com/util/hooks/useInteractionState'

import {BaseProps} from '#/view/com/forms/types'

type Props = BaseProps &
  Omit<TextInputProps, 'placeholder'> & {
    placeholder: Required<TextInputProps>['placeholder']
    icon?: React.FunctionComponent<any>
    suffix?: React.FunctionComponent<any>
  }

export function InputText({
  value: initialValue,
  onChange,
  testID,
  accessibilityLabel,
  accessibilityHint,
  label,
  hasError,
  icon: Icon,
  suffix: Suffix,
  ...props
}: Props) {
  const labelId = React.useId()
  const t = useTheme()
  const [value, setValue] = React.useState<string>(initialValue)
  const [suffixPadding, setSuffixPadding] = React.useState(0)
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  const handleSuffixLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      setSuffixPadding(e.nativeEvent.layout.width + 16)
    },
    [setSuffixPadding],
  )

  const {inputStyles, iconStyles} = React.useMemo(() => {
    const input: TextStyle[] = []
    const icon: TextStyle[] = []

    if (Icon) {
      input.push({
        paddingLeft: 40,
      })
    }

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
        borderColor: t.atoms.border_contrast.borderColor,
      })

      if (hasError) {
        input.push({
          borderColor: tokens.color.red_500,
        })
      }
    }

    return {inputStyles: input, iconStyles: icon}
  }, [t, hovered, focused, hasError, Icon])

  const handleOnChange = React.useCallback(
    (e: any) => {
      const value = e.currentTarget.value
      onChange(value)
      setValue(value)
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

      <TextInput
        {...props}
        value={value}
        testID={testID}
        aria-labelledby={labelId}
        aria-label={label}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        placeholderTextColor={t.atoms.text_contrast_500.color}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={handleOnChange}
        {...web({
          onMouseEnter: onHoverIn,
          onMouseLeave: onHoverOut,
        })}
        style={[
          t.name === 'dark' ? t.atoms.bg_contrast_100 : t.atoms.bg,
          atoms.w_full,
          atoms.px_lg,
          atoms.py_md,
          atoms.rounded_sm,
          atoms.text_md,
          t.atoms.border,
          t.atoms.text,
          web({
            paddingTop: atoms.pt_md.paddingTop - 1,
          }),
          {paddingRight: suffixPadding},
          {borderWidth: 2, lineHeight: atoms.text_md.lineHeight * 1.1875},
          ...inputStyles,
          ...(Array.isArray(props.style) ? props.style : [props.style]),
        ]}
      />

      {Icon && (
        <View
          style={[
            atoms.absolute,
            atoms.inset_0,
            atoms.align_center,
            atoms.justify_center,
            atoms.pl_md,
            {right: 'auto'},
          ]}>
          <Icon
            style={[
              {color: t.atoms.border_contrast.borderColor},
              {
                width: 20,
                pointerEvents: 'none',
              },
              ...iconStyles,
            ]}
          />
        </View>
      )}

      {Suffix && (
        <View
          onLayout={handleSuffixLayout}
          style={[
            atoms.absolute,
            atoms.inset_0,
            atoms.align_center,
            atoms.justify_center,
            atoms.pr_lg,
            {left: 'auto'},
          ]}>
          <Suffix />
        </View>
      )}
    </View>
  )
}

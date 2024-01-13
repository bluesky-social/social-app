import React from 'react'
import {
  View,
  TextInput,
  TextInputProps,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native'

import {useTheme, atoms, web, tokens} from '#/alf'
import {Text} from '#/components/Typography'
import {useInteractionState} from '#/components/hooks/useInteractionState'

import {BaseProps} from '#/components/forms/types'

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
  const hasIcon = !!Icon

  const handleSuffixLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      setSuffixPadding(e.nativeEvent.layout.width + 16)
    },
    [setSuffixPadding],
  )

  const {inputBaseStyles, inputHoverStyles, inputFocusStyles} =
    React.useMemo(() => {
      const base: TextStyle[] = []
      const hover: TextStyle[] = [
        {
          borderColor: t.palette.contrast_300,
        },
      ]
      const focus: TextStyle[] = [
        {
          backgroundColor: t.palette.contrast_50,
          borderColor: t.palette.primary_500,
        },
      ]

      if (hasIcon) {
        base.push({
          paddingLeft: 40,
        })
      }

      if (hasError) {
        base.push({
          backgroundColor:
            t.name === 'light' ? t.palette.negative_25 : t.palette.negative_900,
          borderColor:
            t.name === 'light'
              ? t.palette.negative_300
              : t.palette.negative_800,
        })
        hover.push({
          borderColor: tokens.color.red_500,
        })
        focus.push({
          backgroundColor:
            t.name === 'light' ? t.palette.negative_25 : t.palette.negative_900,
          borderColor: tokens.color.red_500,
        })
      }

      return {
        inputBaseStyles: base,
        inputHoverStyles: hover,
        inputFocusStyles: focus,
      }
    }, [t, hasError, hasIcon])

  const {iconBaseStyles, iconHoverStyles, iconFocusStyles} =
    React.useMemo(() => {
      const base: TextStyle[] = []
      const hover: TextStyle[] = [
        {
          color: t.palette.contrast_500,
        },
      ]
      const focus: TextStyle[] = [
        {
          color: t.palette.primary_500,
        },
      ]

      if (hasError) {
        base.push({
          color: t.palette.negative_400,
        })
        hover.push({
          color: t.palette.negative_500,
        })
        focus.push({
          color: t.palette.negative_500,
        })
      }

      return {
        iconBaseStyles: base,
        iconHoverStyles: hover,
        iconFocusStyles: focus,
      }
    }, [t, hasError])

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
        placeholderTextColor={t.atoms.text_contrast_400.color}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={handleOnChange}
        {...web({
          onMouseEnter: onHoverIn,
          onMouseLeave: onHoverOut,
        })}
        style={[
          t.atoms.bg_contrast_50,
          atoms.w_full,
          atoms.px_lg,
          atoms.py_md,
          atoms.rounded_sm,
          atoms.text_md,
          t.atoms.text,
          web({
            paddingTop: atoms.pt_md.paddingTop - 1,
          }),
          {borderColor: 'transparent', paddingRight: suffixPadding},
          {borderWidth: 2, lineHeight: atoms.text_md.lineHeight * 1.1875},
          ...inputBaseStyles,
          ...(hovered ? inputHoverStyles : []),
          ...(focused ? inputFocusStyles : []),
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
              {
                color:
                  t.name === 'light'
                    ? t.palette.contrast_400
                    : t.palette.contrast_700,
              },
              {
                width: 20,
                pointerEvents: 'none',
              },
              ...iconBaseStyles,
              ...(hovered ? iconHoverStyles : []),
              ...(focused ? iconFocusStyles : []),
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

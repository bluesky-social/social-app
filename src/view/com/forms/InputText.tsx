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

type Props = Omit<TextInputProps, 'placeholder'> & {
  label?: string
  placeholder: string
  hasError?: boolean
  icon?: React.FunctionComponent<any>
  suffix?: React.FunctionComponent<any>
}

export function InputText({
  label,
  hasError,
  icon: Icon,
  suffix: Suffix,
  ...props
}: Props) {
  const labelId = React.useId()
  const t = useTheme()
  const [state, setState] = React.useState({
    hovered: false,
    focused: false,
  })
  const [suffixPadding, setSuffixPadding] = React.useState(0)

  const onHoverIn = React.useCallback(() => {
    setState(s => ({
      ...s,
      hovered: true,
    }))
  }, [setState])
  const onHoverOut = React.useCallback(() => {
    setState(s => ({
      ...s,
      hovered: false,
    }))
  }, [setState])
  const onFocus = React.useCallback(() => {
    setState(s => ({
      ...s,
      focused: true,
    }))
  }, [setState])
  const onBlur = React.useCallback(() => {
    setState(s => ({
      ...s,
      focused: false,
    }))
  }, [setState])
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

    if (state.hovered || state.focused) {
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
  }, [t, state, hasError, Icon])

  return (
    <View style={[atoms.relative, atoms.w_full]}>
      {label && (
        <Text
          nativeID={labelId}
          style={[
            atoms.text_sm,
            atoms.font_semibold,
            t.atoms.text_contrast_700,
            atoms.mb_sm,
          ]}>
          {label}
        </Text>
      )}

      <TextInput
        aria-labelledby={labelId}
        aria-label={label}
        placeholderTextColor={t.atoms.text_contrast_500.color}
        {...props}
        onFocus={onFocus}
        onBlur={onBlur}
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
              {color: t.atoms.border_contrast_500.borderColor},
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

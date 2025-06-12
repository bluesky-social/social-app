import React from 'react'
import {
  type AccessibilityProps,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'

import {HITSLOP_20} from '#/lib/constants'
import {mergeRefs} from '#/lib/merge-refs'
import {
  android,
  applyFonts,
  atoms as a,
  ios,
  type TextStyleProp,
  useAlf,
  useTheme,
  web,
} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Text} from '#/components/Typography'

const Context = React.createContext<{
  inputRef: React.RefObject<TextInput> | null
  isInvalid: boolean
  hovered: boolean
  onHoverIn: () => void
  onHoverOut: () => void
  focused: boolean
  onFocus: () => void
  onBlur: () => void
}>({
  inputRef: null,
  isInvalid: false,
  hovered: false,
  onHoverIn: () => {},
  onHoverOut: () => {},
  focused: false,
  onFocus: () => {},
  onBlur: () => {},
})

export type RootProps = React.PropsWithChildren<{isInvalid?: boolean}>

export function Root({children, isInvalid = false}: RootProps) {
  const inputRef = React.useRef<TextInput>(null)
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  const context = React.useMemo(
    () => ({
      inputRef,
      hovered,
      onHoverIn,
      onHoverOut,
      focused,
      onFocus,
      onBlur,
      isInvalid,
    }),
    [
      inputRef,
      hovered,
      onHoverIn,
      onHoverOut,
      focused,
      onFocus,
      onBlur,
      isInvalid,
    ],
  )

  return (
    <Context.Provider value={context}>
      <View
        style={[a.flex_row, a.align_center, a.relative, a.w_full, a.px_md]}
        {...web({
          onClick: () => inputRef.current?.focus(),
          onMouseOver: onHoverIn,
          onMouseOut: onHoverOut,
        })}>
        {children}
      </View>
    </Context.Provider>
  )
}

export function useSharedInputStyles() {
  const t = useTheme()
  return React.useMemo(() => {
    const hover: ViewStyle[] = [
      {
        borderColor: t.palette.contrast_100,
      },
    ]
    const focus: ViewStyle[] = [
      {
        backgroundColor: t.palette.contrast_50,
        borderColor: t.palette.primary_500,
      },
    ]
    const error: ViewStyle[] = [
      {
        backgroundColor: t.palette.negative_25,
        borderColor: t.palette.negative_300,
      },
    ]
    const errorHover: ViewStyle[] = [
      {
        backgroundColor: t.palette.negative_25,
        borderColor: t.palette.negative_500,
      },
    ]

    return {
      chromeHover: StyleSheet.flatten(hover),
      chromeFocus: StyleSheet.flatten(focus),
      chromeError: StyleSheet.flatten(error),
      chromeErrorHover: StyleSheet.flatten(errorHover),
    }
  }, [t])
}

export type InputProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string
  /**
   * @deprecated Controlled inputs are *strongly* discouraged. Use `defaultValue` instead where possible.
   *
   * See https://github.com/facebook/react-native-website/pull/4247
   */
  value?: string
  onChangeText?: (value: string) => void
  isInvalid?: boolean
  inputRef?: React.RefObject<TextInput> | React.ForwardedRef<TextInput>
}

export function createInput(Component: typeof TextInput) {
  return function Input({
    label,
    placeholder,
    value,
    onChangeText,
    onFocus,
    onBlur,
    isInvalid,
    inputRef,
    style,
    ...rest
  }: InputProps) {
    const t = useTheme()
    const {fonts} = useAlf()
    const ctx = React.useContext(Context)
    const withinRoot = Boolean(ctx.inputRef)

    const {chromeHover, chromeFocus, chromeError, chromeErrorHover} =
      useSharedInputStyles()

    if (!withinRoot) {
      return (
        <Root isInvalid={isInvalid}>
          <Input
            label={label}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            isInvalid={isInvalid}
            {...rest}
          />
        </Root>
      )
    }

    const refs = mergeRefs([ctx.inputRef, inputRef!].filter(Boolean))

    const flattened = StyleSheet.flatten([
      a.relative,
      a.z_20,
      a.flex_1,
      a.text_md,
      t.atoms.text,
      a.px_xs,
      {
        // paddingVertical doesn't work w/multiline - esb
        lineHeight: a.text_md.fontSize * 1.1875,
        textAlignVertical: rest.multiline ? 'top' : undefined,
        minHeight: rest.multiline ? 80 : undefined,
        minWidth: 0,
      },
      ios({paddingTop: 12, paddingBottom: 13}),
      android(a.py_md),
      // fix for autofill styles covering border
      web({
        paddingTop: 10,
        paddingBottom: 11,
        marginTop: 2,
        marginBottom: 2,
      }),
      style,
    ])

    applyFonts(flattened, fonts.family)

    // should always be defined on `typography`
    // @ts-ignore
    if (flattened.fontSize) {
      // @ts-ignore
      flattened.fontSize = Math.round(
        // @ts-ignore
        flattened.fontSize * fonts.scaleMultiplier,
      )
    }

    return (
      <>
        <Component
          accessibilityHint={undefined}
          hitSlop={HITSLOP_20}
          {...rest}
          accessibilityLabel={label}
          ref={refs}
          value={value}
          onChangeText={onChangeText}
          onFocus={e => {
            ctx.onFocus()
            onFocus?.(e)
          }}
          onBlur={e => {
            ctx.onBlur()
            onBlur?.(e)
          }}
          placeholder={placeholder || label}
          placeholderTextColor={t.palette.contrast_500}
          keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
          style={flattened}
        />

        <View
          style={[
            a.z_10,
            a.absolute,
            a.inset_0,
            a.rounded_sm,
            t.atoms.bg_contrast_25,
            {borderColor: 'transparent', borderWidth: 2},
            ctx.hovered ? chromeHover : {},
            ctx.focused ? chromeFocus : {},
            ctx.isInvalid || isInvalid ? chromeError : {},
            (ctx.isInvalid || isInvalid) && (ctx.hovered || ctx.focused)
              ? chromeErrorHover
              : {},
          ]}
        />
      </>
    )
  }
}

export const Input = createInput(TextInput)

export function LabelText({
  nativeID,
  children,
}: React.PropsWithChildren<{nativeID?: string}>) {
  const t = useTheme()
  return (
    <Text
      nativeID={nativeID}
      style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium, a.mb_sm]}>
      {children}
    </Text>
  )
}

export function Icon({icon: Comp}: {icon: React.ComponentType<SVGIconProps>}) {
  const t = useTheme()
  const ctx = React.useContext(Context)
  const {hover, focus, errorHover, errorFocus} = React.useMemo(() => {
    const hover: TextStyle[] = [
      {
        color: t.palette.contrast_800,
      },
    ]
    const focus: TextStyle[] = [
      {
        color: t.palette.primary_500,
      },
    ]
    const errorHover: TextStyle[] = [
      {
        color: t.palette.negative_500,
      },
    ]
    const errorFocus: TextStyle[] = [
      {
        color: t.palette.negative_500,
      },
    ]

    return {
      hover,
      focus,
      errorHover,
      errorFocus,
    }
  }, [t])

  return (
    <View style={[a.z_20, a.pr_xs]}>
      <Comp
        size="md"
        style={[
          {color: t.palette.contrast_500, pointerEvents: 'none', flexShrink: 0},
          ctx.hovered ? hover : {},
          ctx.focused ? focus : {},
          ctx.isInvalid && ctx.hovered ? errorHover : {},
          ctx.isInvalid && ctx.focused ? errorFocus : {},
        ]}
      />
    </View>
  )
}

export function SuffixText({
  children,
  label,
  accessibilityHint,
  style,
}: React.PropsWithChildren<
  TextStyleProp & {
    label: string
    accessibilityHint?: AccessibilityProps['accessibilityHint']
  }
>) {
  const t = useTheme()
  const ctx = React.useContext(Context)
  return (
    <Text
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      numberOfLines={1}
      style={[
        a.z_20,
        a.pr_sm,
        a.text_md,
        t.atoms.text_contrast_medium,
        a.pointer_events_none,
        web([{marginTop: -2}, a.leading_snug]),
        (ctx.hovered || ctx.focused) && {color: t.palette.contrast_800},
        style,
      ]}>
      {children}
    </Text>
  )
}

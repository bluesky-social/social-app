import React from 'react'
import {
  View,
  TextInput,
  TextInputProps,
  TextStyle,
  ViewStyle,
  Pressable,
  StyleSheet,
  AccessibilityProps,
} from 'react-native'

import {HITSLOP_20} from 'lib/constants'
import {isWeb} from '#/platform/detection'
import {useTheme, atoms as a, web, tokens, android} from '#/alf'
import {Text} from '#/components/Typography'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Props as SVGIconProps} from '#/components/icons/common'

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
  const rootRef = React.useRef<View>(null)
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

  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !isWeb) return
    // @ts-ignore web only
    root.tabIndex = -1
  }, [])

  return (
    <Context.Provider value={context}>
      <Pressable
        accessibilityRole="button"
        ref={rootRef}
        role="none"
        style={[
          a.flex_row,
          a.align_center,
          a.relative,
          a.w_full,
          a.px_md,
          {
            paddingVertical: 14,
          },
        ]}
        // onPressIn/out don't work on android web
        onPress={() => inputRef.current?.focus()}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}>
        {children}
      </Pressable>
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
        backgroundColor:
          t.name === 'light' ? t.palette.negative_25 : t.palette.negative_900,
        borderColor:
          t.name === 'light' ? t.palette.negative_300 : t.palette.negative_800,
      },
    ]
    const errorHover: ViewStyle[] = [
      {
        backgroundColor:
          t.name === 'light' ? t.palette.negative_25 : t.palette.negative_900,
        borderColor: tokens.color.red_500,
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
  value: string
  onChangeText: (value: string) => void
  isInvalid?: boolean
}

export function createInput(Component: typeof TextInput) {
  return function Input({
    label,
    placeholder,
    value,
    onChangeText,
    isInvalid,
    ...rest
  }: InputProps) {
    const t = useTheme()
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

    return (
      <>
        <Component
          accessibilityHint={undefined}
          {...rest}
          aria-label={label}
          accessibilityLabel={label}
          ref={ctx.inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={ctx.onFocus}
          onBlur={ctx.onBlur}
          placeholder={placeholder || label}
          placeholderTextColor={t.palette.contrast_500}
          hitSlop={HITSLOP_20}
          style={[
            a.relative,
            a.z_20,
            a.flex_1,
            a.text_md,
            t.atoms.text,
            a.px_xs,
            android({
              paddingBottom: 2,
            }),
            {
              lineHeight: a.text_md.fontSize * 1.1875,
              textAlignVertical: rest.multiline ? 'top' : undefined,
              minHeight: rest.multiline ? 60 : undefined,
            },
          ]}
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

export function Label({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  return (
    <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_600, a.mb_sm]}>
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
          {color: t.palette.contrast_500, pointerEvents: 'none'},
          ctx.hovered ? hover : {},
          ctx.focused ? focus : {},
          ctx.isInvalid && ctx.hovered ? errorHover : {},
          ctx.isInvalid && ctx.focused ? errorFocus : {},
        ]}
      />
    </View>
  )
}

export function Suffix({
  children,
  label,
  accessibilityHint,
}: React.PropsWithChildren<{
  label: string
  accessibilityHint?: AccessibilityProps['accessibilityHint']
}>) {
  const t = useTheme()
  const ctx = React.useContext(Context)
  return (
    <Text
      aria-label={label}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[
        a.z_20,
        a.pr_sm,
        a.text_md,
        t.atoms.text_contrast_400,
        {
          pointerEvents: 'none',
        },
        web({
          marginTop: -2,
        }),
        ctx.hovered || ctx.focused
          ? {
              color: t.palette.contrast_800,
            }
          : {},
      ]}>
      {children}
    </Text>
  )
}

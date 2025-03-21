import React from 'react'
import {Pressable, StyleProp, View, ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import flattenReactChildren from 'react-keyed-flatten-children'

import {isAndroid, isIOS, isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {
  Context,
  ItemContext,
  useMenuContext,
  useMenuItemContext,
} from '#/components/Menu/context'
import {
  ContextType,
  GroupProps,
  ItemIconProps,
  ItemProps,
  ItemTextProps,
  TriggerProps,
} from '#/components/Menu/types'
import {Text} from '#/components/Typography'

export {
  type DialogControlProps as MenuControlProps,
  useDialogControl as useMenuControl,
} from '#/components/Dialog'

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: Dialog.DialogControlProps
}>) {
  const defaultControl = Dialog.useDialogControl()
  const context = React.useMemo<ContextType>(
    () => ({
      control: control || defaultControl,
    }),
    [control, defaultControl],
  )

  return <Context.Provider value={context}>{children}</Context.Provider>
}

export function Trigger({
  children,
  label,
  role = 'button',
  hint,
}: TriggerProps) {
  const context = useMenuContext()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return children({
    isNative: true,
    control: context.control,
    state: {
      hovered: false,
      focused,
      pressed,
    },
    props: {
      ref: null,
      onPress: context.control.open,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
      accessibilityHint: hint,
      accessibilityLabel: label,
      accessibilityRole: role,
    },
  })
}

export function Outer({
  children,
  showCancel,
}: React.PropsWithChildren<{
  showCancel?: boolean
  style?: StyleProp<ViewStyle>
}>) {
  const context = useMenuContext()
  const {_} = useLingui()

  return (
    <Dialog.Outer
      control={context.control}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      {/* Re-wrap with context since Dialogs are portal-ed to root */}
      <Context.Provider value={context}>
        <Dialog.ScrollableInner label={_(msg`Menu`)}>
          <View style={[a.gap_lg]}>
            {children}
            {isNative && showCancel && <Cancel />}
          </View>
        </Dialog.ScrollableInner>
      </Context.Provider>
    </Dialog.Outer>
  )
}

export function Item({children, label, style, onPress, ...rest}: ItemProps) {
  const t = useTheme()
  const context = useMenuContext()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return (
    <Pressable
      {...rest}
      accessibilityHint=""
      accessibilityLabel={label}
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={async e => {
        if (isAndroid) {
          /**
           * Below fix for iOS doesn't work for Android, this does.
           */
          onPress?.(e)
          context.control.close()
        } else if (isIOS) {
          /**
           * Fixes a subtle bug on iOS
           * {@link https://github.com/bluesky-social/social-app/pull/5849/files#diff-de516ef5e7bd9840cd639213301df38cf03acfcad5bda85a1d63efd249ba79deL124-L127}
           */
          context.control.close(() => {
            onPress?.(e)
          })
        }
      }}
      onPressIn={e => {
        onPressIn()
        rest.onPressIn?.(e)
      }}
      onPressOut={e => {
        onPressOut()
        rest.onPressOut?.(e)
      }}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_md,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {minHeight: 44, paddingVertical: 10},
        style,
        (focused || pressed) && !rest.disabled && [t.atoms.bg_contrast_50],
      ]}>
      <ItemContext.Provider value={{disabled: Boolean(rest.disabled)}}>
        {children}
      </ItemContext.Provider>
    </Pressable>
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  const {disabled} = useMenuItemContext()
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="middle"
      style={[
        a.flex_1,
        a.text_md,
        a.font_bold,
        t.atoms.text_contrast_high,
        {paddingTop: 3},
        style,
        disabled && t.atoms.text_contrast_low,
      ]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp}: ItemIconProps) {
  const t = useTheme()
  const {disabled} = useMenuItemContext()
  return (
    <Comp
      size="lg"
      fill={
        disabled
          ? t.atoms.text_contrast_low.color
          : t.atoms.text_contrast_medium.color
      }
    />
  )
}

export function ItemRadio({selected}: {selected: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.justify_center,
        a.align_center,
        a.rounded_full,
        t.atoms.border_contrast_high,
        {
          borderWidth: 1,
          height: 20,
          width: 20,
        },
      ]}>
      {selected ? (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            {height: 14, width: 14},
            selected
              ? {
                  backgroundColor: t.palette.primary_500,
                }
              : {},
          ]}
        />
      ) : null}
    </View>
  )
}

export function LabelText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.font_bold,
        t.atoms.text_contrast_medium,
        {
          marginBottom: -8,
        },
      ]}>
      {children}
    </Text>
  )
}

export function Group({children, style}: GroupProps) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_md,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
        style,
      ]}>
      {flattenReactChildren(children).map((child, i) => {
        return React.isValidElement(child) && child.type === Item ? (
          <React.Fragment key={i}>
            {i > 0 ? (
              <View style={[a.border_b, t.atoms.border_contrast_low]} />
            ) : null}
            {React.cloneElement(child, {
              // @ts-ignore
              style: {
                borderRadius: 0,
                borderWidth: 0,
              },
            })}
          </React.Fragment>
        ) : null
      })}
    </View>
  )
}

function Cancel() {
  const {_} = useLingui()
  const context = useMenuContext()

  return (
    <Button
      label={_(msg`Close this dialog`)}
      size="small"
      variant="ghost"
      color="secondary"
      onPress={() => context.control.close()}>
      <ButtonText>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )
}

export function Divider() {
  return null
}

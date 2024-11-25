import React from 'react'
import {Pressable, StyleProp, View, ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import flattenReactChildren from 'react-keyed-flatten-children'

import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Context, ItemContext} from '#/components/Menu/context'
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

export function useMemoControlContext() {
  return React.useContext(Context)
}

export function Root({
  children,
  control,
}: React.PropsWithChildren<{
  control?: Dialog.DialogOuterProps['control']
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

export function Trigger({children, label, role = 'button'}: TriggerProps) {
  const {control} = React.useContext(Context)
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return children({
    isNative: true,
    control,
    state: {
      hovered: false,
      focused,
      pressed,
    },
    props: {
      onPress: control.open,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
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
  const context = React.useContext(Context)
  const {_} = useLingui()

  return (
    <Dialog.Outer
      control={context.control}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      {/* Re-wrap with context since Dialogs are portal-ed to root */}
      <Context.Provider value={context}>
        <Dialog.ScrollableInner label={_(msg`Menu`)} style={[a.py_sm]}>
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
  const {control} = React.useContext(Context)
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
        await onPress(e)
        if (!e.defaultPrevented) {
          control?.close()
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
  const {disabled} = React.useContext(ItemContext)
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
  const {disabled} = React.useContext(ItemContext)
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
  const {control} = React.useContext(Context)

  return (
    <Button
      label={_(msg`Close this dialog`)}
      size="small"
      variant="ghost"
      color="secondary"
      onPress={() => control.close()}>
      <ButtonText>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )
}

export function Divider() {
  return null
}

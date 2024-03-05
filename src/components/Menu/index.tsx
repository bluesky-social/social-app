import React from 'react'
import {View, Pressable} from 'react-native'

import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'

import {Context} from '#/components/Menu/context'
import {
  ContextType,
  TriggerChildProps,
  ItemProps,
  GroupProps,
  ItemTextProps,
  ItemIconProps,
} from '#/components/Menu/types'

export {useDialogControl as useMenuControl} from '#/components/Dialog'

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

export function Trigger({
  children,
}: ViewStyleProp & {
  children(props: TriggerChildProps): React.ReactNode
}) {
  const {control} = React.useContext(Context)
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  if (!control) {
    throw new Error('Menu.Trigger must be used within a Menu.Root')
  }

  return children({
    isNative: true,
    control,
    state: {
      hovered: false,
      focused,
      pressed,
    },
    handlers: {
      onPress: control.open,
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
    },
  })
}

export function Outer({children}: React.PropsWithChildren<{}>) {
  const {control} = React.useContext(Context)

  if (!control) {
    throw new Error('Menu.Outer must be used within a Menu.Root')
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label="Menu TODO">
        <View style={[a.gap_lg]}>{children}</View>
        <View style={{height: a.gap_lg.gap}} />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export function Item({children, label, style, onPress}: ItemProps) {
  const t = useTheme()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return (
    <Pressable
      accessibilityHint=""
      accessibilityLabel={label}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.p_md,
        a.rounded_md,
        t.atoms.bg_contrast_25,
        {minHeight: 48},
        style,
        (focused || pressed) && [t.atoms.bg_contrast_50],
      ]}>
      {children}
    </Pressable>
  )
}

export function ItemText({children, style}: ItemTextProps) {
  const t = useTheme()
  return (
    <Text
      style={[
        a.text_md,
        a.font_bold,
        t.atoms.text_contrast_medium,
        {paddingTop: 2},
        style,
      ]}>
      {children}
    </Text>
  )
}

export function ItemIcon({icon: Comp}: ItemIconProps) {
  const t = useTheme()
  return <Comp size="lg" fill={t.atoms.text_contrast_medium.color} />
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
      {React.Children.toArray(children).map((child, i) => {
        // ignore null children, like Dividers
        return React.isValidElement(child) && child.props.children ? (
          <React.Fragment>
            {i > 0 ? (
              <View style={[a.border_b, t.atoms.border_contrast_low]} />
            ) : null}
            {React.cloneElement(child, {
              // @ts-ignore
              style: {
                borderRadius: 0,
              },
            })}
          </React.Fragment>
        ) : null
      })}
    </View>
  )
}

export function Divider() {
  return null
}

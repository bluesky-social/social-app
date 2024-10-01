import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {BlueskyBottomSheetView, Pressable} from '@haileyok/bluesky-bottom-sheet'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import flattenReactChildren from 'react-keyed-flatten-children'

import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ItemContext} from '#/components/Menu/context'
import {
  GroupProps,
  ItemIconProps,
  ItemProps,
  ItemTextProps,
  TriggerProps,
} from '#/components/Menu/types'
import {Portal} from '#/components/Portal'
import {Text} from '#/components/Typography'

export {
  type DialogControlProps as MenuControlProps,
  useDialogControl as useMenuControl,
} from '#/components/Dialog'

interface IContext {
  dialogRef: React.RefObject<BlueskyBottomSheetView>
}

const Context = React.createContext({} as IContext)
const useContext = () => React.useContext(Context)

export function Root({children}: React.PropsWithChildren<{}>) {
  const dialogRef = React.useRef<BlueskyBottomSheetView>(null)
  const value = React.useMemo(() => {
    return {dialogRef}
  }, [dialogRef])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function Trigger({children, label}: TriggerProps) {
  const {dialogRef} = useContext()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return children({
    isNative: true,
    dialogRef,
    state: {
      hovered: false,
      focused,
      pressed,
    },
    props: {
      onPress: () => dialogRef.current?.present(),
      onFocus,
      onBlur,
      onPressIn,
      onPressOut,
      accessibilityLabel: label,
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
  const t = useTheme()
  const {dialogRef} = useContext()

  return (
    <Portal>
      <Context.Provider value={{dialogRef}}>
        <BlueskyBottomSheetView ref={dialogRef} cornerRadius={30}>
          <View style={[a.px_xl, a.pb_3xl, t.atoms.bg]}>
            <View style={[a.gap_lg]}>
              {children}
              {isNative && showCancel && <Cancel />}
            </View>
          </View>
        </BlueskyBottomSheetView>
      </Context.Provider>
    </Portal>
  )
}

export function Item({children, label, style, onPress, ...rest}: ItemProps) {
  const t = useTheme()
  const {dialogRef} = useContext()
  const {state: focused} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return (
    <Pressable
      accessibilityHint=""
      accessibilityLabel={label}
      onPress={e => {
        console.log('hi')
        onPress(e)
        dialogRef?.current?.dismiss()
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
  const {dialogRef} = useContext()

  return (
    <Button
      label={_(msg`Close this dialog`)}
      size="small"
      variant="ghost"
      color="secondary"
      onPress={() => dialogRef.current?.dismiss()}>
      <ButtonText>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )
}

export function Divider() {
  return null
}

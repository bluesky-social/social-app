import React, {useMemo, useRef, useState} from 'react'
import {
  Keyboard,
  Pressable,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {runOnJS} from 'react-native-reanimated'
import {useIsFocused} from '@react-navigation/native'
import flattenReactChildren from 'react-keyed-flatten-children'

import {HITSLOP_10} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {atoms as a, useTheme} from '#/alf'
import {
  Context,
  ItemContext,
  useContextMenuContext,
  useContextMenuItemContext,
} from '#/components/ContextMenu/context'
import {
  ContextType,
  ItemIconProps,
  ItemProps,
  ItemTextProps,
  Measurement,
  TriggerProps,
} from '#/components/ContextMenu/types'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {createPortalGroup} from '#/components/Portal'
import {Text} from '#/components/Typography'
import {Backdrop} from './Backdrop'

export {
  type DialogControlProps as ContextMenuControlProps,
  useDialogControl as useContextMenuControl,
} from '#/components/Dialog'

const {Provider: PortalProvider, Outlet, Portal} = createPortalGroup()

export function Provider({children}: {children: React.ReactNode}) {
  return (
    <PortalProvider>
      {children}
      <Outlet />
    </PortalProvider>
  )
}

export function Root({children}: {children: React.ReactNode}) {
  const [measurement, setMeasurement] = useState<Measurement | null>(null)
  const isFocused = useIsFocused()

  const context = useMemo<ContextType>(
    () => ({
      isOpen: !!measurement && isFocused,
      measurement,
      open: (evt: Measurement) => {
        setMeasurement(evt)
      },
      close: () => {
        setMeasurement(null)
      },
    }),
    [measurement, setMeasurement, isFocused],
  )

  return <Context.Provider value={context}>{children}</Context.Provider>
}

export function Trigger({children, label, style}: TriggerProps) {
  const context = useContextMenuContext()
  const playHaptic = useHaptics()
  const ref = useRef<View>(null)

  const open = useNonReactiveCallback(() => {
    playHaptic()
    Keyboard.dismiss()
    ref.current?.measure((x, y, width, height, pageX, pageY) =>
      context.open({x, y, width, height, pageX, pageY}),
    )
  })

  const doubleTapGesture = useMemo(() => {
    return Gesture.Tap()
      .numberOfTaps(2)
      .hitSlop(HITSLOP_10)
      .onEnd(open)
      .runOnJS(true)
  }, [open])

  const pressAndHoldGesture = useMemo(() => {
    return Gesture.LongPress()
      .onStart(() => {
        runOnJS(open)()
      })
      .cancelsTouchesInView(false)
  }, [open])

  const composedGestures = Gesture.Exclusive(
    doubleTapGesture,
    pressAndHoldGesture,
  )

  console.log(context.measurement)

  return (
    <>
      <GestureDetector gesture={composedGestures}>
        <View ref={ref} style={[{opacity: context.isOpen ? 0 : 1}, style]}>
          {children({
            isNative: true,
            control: {isOpen: context.isOpen, open},
            state: {
              pressed: false,
              hovered: false,
              focused: false,
            },
            props: {
              ref: null,
              onPress: null,
              onFocus: null,
              onBlur: null,
              onPressIn: null,
              onPressOut: null,
              accessibilityHint: null,
              accessibilityLabel: label,
              accessibilityRole: null,
            },
          })}
        </View>
      </GestureDetector>
      {context.isOpen && context.measurement && (
        <Portal>
          <Animated.View
            style={[
              a.absolute,
              {
                top: context.measurement.pageY,
                left: context.measurement.pageX,
                width: context.measurement.width,
                height: context.measurement.height,
              },
              a.z_10,
            ]}>
            {children({
              isNative: true,
              control: {isOpen: context.isOpen, open},
              state: {
                pressed: false,
                hovered: false,
                focused: false,
              },
              props: {
                ref: null,
                onPress: null,
                onFocus: null,
                onBlur: null,
                onPressIn: null,
                onPressOut: null,
                accessibilityHint: null,
                accessibilityLabel: label,
                accessibilityRole: null,
              },
            })}
          </Animated.View>
        </Portal>
      )}
    </>
  )
}

export function Outer({
  children,
  style,
  align = 'left',
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  align?: 'left' | 'right'
}) {
  const t = useTheme()
  const context = useContextMenuContext()
  const {width: screenWidth} = useWindowDimensions()

  if (!context.isOpen || !context.measurement) return null

  return (
    <Portal>
      <Context.Provider value={context}>
        <Backdrop active={context.isOpen} onPress={context.close} />
        <View
          style={[
            a.rounded_md,
            a.overflow_hidden,
            a.border,
            t.atoms.border_contrast_low,
            a.shadow_lg,
            a.mt_xs,
            a.w_full,
            {maxWidth: '60%'},
            a.absolute,
            {top: context.measurement.pageY + context.measurement.height},
            a.z_10,
            align === 'left'
              ? {left: context.measurement.pageX}
              : {
                  right:
                    screenWidth -
                    context.measurement.pageX -
                    context.measurement.width,
                },
            style,
          ]}>
          {flattenReactChildren(children).map((child, i) => {
            return React.isValidElement(child) &&
              (child.type === Item || child.type === Divider) ? (
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
      </Context.Provider>
    </Portal>
  )
}

export function Item({children, label, style, onPress, ...rest}: ItemProps) {
  const t = useTheme()
  const context = useContextMenuContext()
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
      onPress={e => {
        context.close()
        onPress?.(e)
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
        a.py_sm,
        a.px_md,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {minHeight: 40},
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
  const {disabled} = useContextMenuItemContext()
  return (
    <Text
      numberOfLines={2}
      ellipsizeMode="middle"
      style={[
        a.flex_1,
        a.text_sm,
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
  const {disabled} = useContextMenuItemContext()
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
            selected ? {backgroundColor: t.palette.primary_500} : {},
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
      style={[a.font_bold, t.atoms.text_contrast_medium, {marginBottom: -8}]}>
      {children}
    </Text>
  )
}

export function Divider() {
  const t = useTheme()
  return (
    <View
      style={[t.atoms.border_contrast_low, a.flex_1, {borderTopWidth: 3}]}
    />
  )
}

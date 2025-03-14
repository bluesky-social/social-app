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
import {runOnJS} from 'react-native-reanimated'
import {captureRef} from 'react-native-view-shot'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
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
  const {_} = useLingui()
  const isFocused = useIsFocused()
  const [image, setImage] = useState<string | null>(null)
  const [pendingMeasurement, setPendingMeasurement] =
    useState<Measurement | null>(null)

  const open = useNonReactiveCallback(async () => {
    playHaptic()
    Keyboard.dismiss()
    const [measurement, capture] = await Promise.all([
      new Promise<Measurement>(resolve => {
        ref.current?.measureInWindow((x, y, width, height) =>
          resolve({x, y, width, height}),
        )
      }),
      captureRef(ref, {result: 'data-uri'}),
    ])
    setImage(capture)
    setPendingMeasurement(measurement)
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

  const measurement = context.measurement || pendingMeasurement

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
      {isFocused && image && measurement && (
        <Portal>
          <Image
            onDisplay={() => {
              console.log('Image displayed')
              if (pendingMeasurement) {
                context.open(pendingMeasurement)
                setPendingMeasurement(null)
              }
            }}
            source={image}
            style={[
              a.absolute,
              {
                top: measurement.y,
                left: measurement.x,
                width: measurement.width,
                height: measurement.height,
              },
              a.z_10,
            ]}
            accessibilityLabel={_(msg`Context menu trigger`)}
            accessibilityHint={_(
              msg`The item that just triggered the context menu.`,
            )}
            accessibilityIgnoresInvertColors={false}
          />
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
            a.shadow_md,
            a.mt_xs,
            a.w_full,
            {maxWidth: '60%'},
            a.absolute,
            {top: context.measurement.y + context.measurement.height},
            a.z_10,
            align === 'left'
              ? {left: context.measurement.x}
              : {
                  right:
                    screenWidth -
                    context.measurement.x -
                    context.measurement.width,
                },
            style,
          ]}>
          <View
            style={[
              a.flex_1,
              a.rounded_md,
              a.overflow_hidden,
              a.border,
              t.atoms.border_contrast_low,
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

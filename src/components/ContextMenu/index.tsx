import React, {useCallback, useMemo, useRef, useState} from 'react'
import {
  Keyboard,
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  clamp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {captureRef} from 'react-native-view-shot'
import {Image} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused} from '@react-navigation/native'
import flattenReactChildren from 'react-keyed-flatten-children'

import {HITSLOP_10} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {isIOS} from '#/platform/detection'
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

const SPRING: WithSpringConfig = {
  mass: isIOS ? 1.25 : 0.75,
  damping: 150,
  stiffness: 1000,
  restDisplacementThreshold: 0.01,
}

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
  const animationSV = useSharedValue(0)
  const translationSV = useSharedValue(0)
  const isFocused = useIsFocused()

  const clearMeasurement = useCallback(() => setMeasurement(null), [])

  const context = useMemo<ContextType>(
    () => ({
      isOpen: !!measurement && isFocused,
      measurement,
      animationSV,
      translationSV,
      open: (evt: Measurement) => {
        setMeasurement(evt)
        animationSV.set(withSpring(1, SPRING))
      },
      close: () => {
        animationSV.set(
          withTiming(0, {duration: 150}, finished => {
            if (finished) {
              runOnJS(clearMeasurement)()
            }
          }),
        )
      },
    }),
    [
      measurement,
      setMeasurement,
      isFocused,
      animationSV,
      translationSV,
      clearMeasurement,
    ],
  )

  return <Context.Provider value={context}>{children}</Context.Provider>
}

export function Trigger({children, label, style}: TriggerProps) {
  const context = useContextMenuContext()
  const playHaptic = useHaptics()
  const ref = useRef<View>(null)
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
          <TriggerClone
            image={image}
            measurement={measurement}
            onDisplay={() => {
              if (pendingMeasurement) {
                context.open(pendingMeasurement)
                setPendingMeasurement(null)
              }
            }}
          />
        </Portal>
      )}
    </>
  )
}

/**
 * an image of the underlying trigger with a grow animation
 */
function TriggerClone({
  image,
  measurement,
  onDisplay,
}: {
  image: string
  measurement: Measurement
  onDisplay: () => void
}) {
  const {_} = useLingui()

  return (
    <Image
      onDisplay={() => {
        onDisplay()
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
      accessibilityHint={_(msg`The item that just triggered the context menu.`)}
      accessibilityIgnoresInvertColors={false}
    />
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
  const {width: screenWidth, height: screenHeight} = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [hasBeenMeasured, setHasBeenMeasured] = useState(false)

  const {animationSV, translationSV} = context

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: clamp(animationSV.get(), 0, 1),
    transform: [
      {scale: interpolate(animationSV.get(), [0, 1], [0.2, 1])},
      {translateY: translationSV.get() * animationSV.get()},
    ],
  }))

  const onLayout = useCallback(
    (evt: LayoutChangeEvent) => {
      if (!context.measurement) return // should not happen

      const {height} = evt.nativeEvent.layout
      const screenPosition =
        context.measurement.y + context.measurement.height + 4
      const bottomPosition = screenPosition + height
      const safeAreaBottomLimit = screenHeight - insets.bottom - 20 // to be safe
      const diff = bottomPosition - safeAreaBottomLimit
      if (diff > 0) {
        translationSV.set(-diff)
      }
      console.log('measused, diff:', diff)
      setHasBeenMeasured(true)
    },
    [context.measurement, screenHeight, insets, translationSV],
  )

  if (!context.measurement) return null

  return (
    <Portal>
      <Context.Provider value={context}>
        <Backdrop animation={animationSV} onPress={context.close} />
        <Animated.View
          onLayout={!hasBeenMeasured ? onLayout : undefined}
          style={[
            a.rounded_md,
            a.shadow_md,
            a.mt_xs,
            a.w_full,
            a.z_10,
            a.absolute,
            {
              maxWidth: '60%',
              transformOrigin: align === 'left' ? 'top left' : 'top right',
              top: context.measurement.y + context.measurement.height,
            },
            align === 'left'
              ? {left: context.measurement.x}
              : {
                  right:
                    screenWidth -
                    context.measurement.x -
                    context.measurement.width,
                },
            hasBeenMeasured ? animatedStyle : {opacity: 0},
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
        </Animated.View>
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

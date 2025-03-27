import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BackHandler,
  Keyboard,
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler'
import Animated, {
  clamp,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated'
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {captureRef} from 'react-native-view-shot'
import {Image, ImageErrorEventData} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused} from '@react-navigation/native'
import flattenReactChildren from 'react-keyed-flatten-children'

import {HITSLOP_10} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {logger} from '#/logger'
import {isAndroid, isIOS} from '#/platform/detection'
import {atoms as a, platform, tokens, useTheme} from '#/alf'
import {
  Context,
  ItemContext,
  MenuContext,
  useContextMenuContext,
  useContextMenuItemContext,
  useContextMenuMenuContext,
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

/**
 * Needs placing near the top of the provider stack, but BELOW the theme provider.
 */
export function Provider({children}: {children: React.ReactNode}) {
  return (
    <PortalProvider>
      {children}
      <Outlet />
    </PortalProvider>
  )
}

export function Root({children}: {children: React.ReactNode}) {
  const playHaptic = useHaptics()
  const [measurement, setMeasurement] = useState<Measurement | null>(null)
  const animationSV = useSharedValue(0)
  const translationSV = useSharedValue(0)
  const isFocused = useIsFocused()
  const hoverables = useRef<
    Map<string, {id: string; rect: Measurement; onTouchUp: () => void}>
  >(new Map())
  const hoverablesSV = useSharedValue<
    Record<string, {id: string; rect: Measurement}>
  >({})
  const syncHoverablesThrottleRef = useRef<ReturnType<typeof setTimeout>>()
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null)

  const onHoverableTouchUp = useCallback((id: string) => {
    const hoverable = hoverables.current.get(id)
    if (!hoverable) {
      logger.warn(`No such hoverable with id ${id}`)
      return
    }
    hoverable.onTouchUp()
  }, [])

  const onCompletedClose = useCallback(() => {
    hoverables.current.clear()
    setMeasurement(null)
  }, [])

  const context = useMemo(
    () =>
      ({
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
            withSpring(0, SPRING, finished => {
              if (finished) {
                hoverablesSV.set({})
                translationSV.set(0)
                runOnJS(onCompletedClose)()
              }
            }),
          )
        },
        registerHoverable: (
          id: string,
          rect: Measurement,
          onTouchUp: () => void,
        ) => {
          hoverables.current.set(id, {id, rect, onTouchUp})
          // we need this data on the UI thread, but we want to limit cross-thread communication
          // and this function will be called in quick succession, so we need to throttle it
          if (syncHoverablesThrottleRef.current)
            clearTimeout(syncHoverablesThrottleRef.current)
          syncHoverablesThrottleRef.current = setTimeout(() => {
            syncHoverablesThrottleRef.current = undefined
            hoverablesSV.set(
              Object.fromEntries(
                // eslint-ignore
                [...hoverables.current.entries()].map(([id, {rect}]) => [
                  id,
                  {id, rect},
                ]),
              ),
            )
          }, 1)
        },
        hoverablesSV,
        onTouchUpMenuItem: onHoverableTouchUp,
        hoveredMenuItem,
        setHoveredMenuItem: item => {
          if (item) playHaptic('Light')
          setHoveredMenuItem(item)
        },
      } satisfies ContextType),
    [
      measurement,
      setMeasurement,
      onCompletedClose,
      isFocused,
      animationSV,
      translationSV,
      hoverablesSV,
      onHoverableTouchUp,
      hoveredMenuItem,
      setHoveredMenuItem,
      playHaptic,
    ],
  )

  useEffect(() => {
    if (isAndroid && context.isOpen) {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        context.close()
        return true
      })

      return () => listener.remove()
    }
  }, [context])

  return <Context.Provider value={context}>{children}</Context.Provider>
}

export function Trigger({children, label, contentLabel, style}: TriggerProps) {
  const context = useContextMenuContext()
  const playHaptic = useHaptics()
  const {top: topInset} = useSafeAreaInsets()
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
          resolve({
            x,
            y:
              y +
              platform({
                default: 0,
                android: topInset, // not included in measurement
              }),
            width,
            height,
          }),
        )
      }),
      captureRef(ref, {result: 'data-uri'}).catch(err => {
        logger.error(err instanceof Error ? err : String(err), {
          message: 'Failed to capture image of context menu trigger',
        })
        // will cause the image to fail to load, but it will get handled gracefully
        return '<failed capture>'
      }),
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

  const {
    hoverablesSV,
    setHoveredMenuItem,
    onTouchUpMenuItem,
    translationSV,
    animationSV,
  } = context
  const hoveredItemSV = useSharedValue<string | null>(null)

  useAnimatedReaction(
    () => hoveredItemSV.get(),
    (hovered, prev) => {
      if (hovered !== prev) {
        runOnJS(setHoveredMenuItem)(hovered)
      }
    },
  )

  const pressAndHoldGesture = useMemo(() => {
    return Gesture.Pan()
      .activateAfterLongPress(500)
      .cancelsTouchesInView(false)
      .averageTouches(true)
      .onStart(() => {
        'worklet'
        runOnJS(open)()
      })
      .onUpdate(evt => {
        'worklet'
        const item = getHoveredHoverable(evt, hoverablesSV, translationSV)
        hoveredItemSV.set(item)
      })
      .onEnd(evt => {
        'worklet'
        const item = getHoveredHoverable(evt, hoverablesSV, translationSV)
        hoveredItemSV.set(null)
        if (item) {
          runOnJS(onTouchUpMenuItem)(item)
        }
      })
  }, [open, hoverablesSV, onTouchUpMenuItem, hoveredItemSV, translationSV])

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
            label={contentLabel}
            translation={translationSV}
            animation={animationSV}
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
  translation,
  animation,
  image,
  measurement,
  onDisplay,
  label,
}: {
  translation: SharedValue<number>
  animation: SharedValue<number>
  image: string
  measurement: Measurement
  onDisplay: () => void
  label: string
}) {
  const {_} = useLingui()

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{translateY: translation.get() * animation.get()}],
  }))

  const handleError = useCallback(
    (evt: ImageErrorEventData) => {
      logger.error('Context menu image load error', {message: evt.error})
      onDisplay()
    },
    [onDisplay],
  )

  return (
    <Animated.View
      style={[
        a.absolute,
        {
          top: measurement.y,
          left: measurement.x,
          width: measurement.width,
          height: measurement.height,
        },
        a.z_10,
        a.pointer_events_none,
        animatedStyles,
      ]}>
      <Image
        onDisplay={onDisplay}
        onError={handleError}
        source={image}
        style={{
          width: measurement.width,
          height: measurement.height,
        }}
        accessibilityLabel={label}
        accessibilityHint={_(msg`The subject of the context menu`)}
        accessibilityIgnoresInvertColors={false}
      />
    </Animated.View>
  )
}

const MENU_WIDTH = 230

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
  const insets = useSafeAreaInsets()
  const frame = useSafeAreaFrame()
  const {width: screenWidth} = useWindowDimensions()

  const {animationSV, translationSV} = context

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translationSV.get() * animationSV.get()}],
  }))

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: clamp(animationSV.get(), 0, 1),
    transform: [{scale: interpolate(animationSV.get(), [0, 1], [0.2, 1])}],
  }))

  const onLayout = useCallback(
    (evt: LayoutChangeEvent) => {
      if (!context.measurement) return // should not happen
      let translation = 0

      // pure vibes based
      const TOP_INSET = insets.top + 80
      const BOTTOM_INSET_IOS = insets.bottom + 20
      const BOTTOM_INSET_ANDROID = 12 // TODO: revisit when edge-to-edge mode is enabled -sfn

      const {height} = evt.nativeEvent.layout
      const topPosition =
        context.measurement.y + context.measurement.height + tokens.space.xs
      const bottomPosition = topPosition + height
      const safeAreaBottomLimit =
        frame.height -
        platform({
          ios: BOTTOM_INSET_IOS,
          android: BOTTOM_INSET_ANDROID,
          default: 0,
        })
      const diff = bottomPosition - safeAreaBottomLimit
      if (diff > 0) {
        translation = -diff
      } else {
        const distanceMessageFromTop = context.measurement.y - TOP_INSET
        if (distanceMessageFromTop < 0) {
          translation = -Math.max(distanceMessageFromTop, diff)
        }
      }

      if (translation !== 0) {
        translationSV.set(translation)
      }
    },
    [context.measurement, frame.height, insets, translationSV],
  )

  const menuContext = useMemo(() => ({align}), [align])

  if (!context.isOpen || !context.measurement) return null

  return (
    <Portal>
      <Context.Provider value={context}>
        <MenuContext.Provider value={menuContext}>
          <Backdrop animation={animationSV} onPress={context.close} />
          {/* containing element - stays the same size, so we measure it
           to determine if a translation is necessary. also has the positioning */}
          <Animated.View
            onLayout={onLayout}
            style={[
              a.absolute,
              a.z_10,
              a.mt_xs,
              {
                width: MENU_WIDTH,
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
              animatedContainerStyle,
            ]}>
            {/* scaling element - has the scale/fade animation on it */}
            <Animated.View
              style={[
                a.rounded_md,
                a.shadow_md,
                t.atoms.bg_contrast_25,
                a.w_full,
                // @ts-ignore react-native-web expects string, and this file is platform-split -sfn
                // note: above @ts-ignore cannot be a @ts-expect-error because this does not cause an error
                // in the typecheck CI - presumably because of RNW overriding the types
                {
                  transformOrigin:
                    // "top right" doesn't seem to work on android, so set explicity in pixels
                    align === 'left' ? [0, 0, 0] : [MENU_WIDTH, 0, 0],
                },
                animatedStyle,
                style,
              ]}>
              {/* innermost element - needs an overflow: hidden for children, but we also need a shadow,
                so put the shadow on the scaling element and the overflow on the innermost element */}
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
                        <View
                          style={[a.border_b, t.atoms.border_contrast_low]}
                        />
                      ) : null}
                      {React.cloneElement(child, {
                        // @ts-expect-error not typed
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
          </Animated.View>
        </MenuContext.Provider>
      </Context.Provider>
    </Portal>
  )
}

export function Item({children, label, style, onPress, ...rest}: ItemProps) {
  const t = useTheme()
  const context = useContextMenuContext()
  const playHaptic = useHaptics()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()
  const id = useId()
  const {align} = useContextMenuMenuContext()

  const {close, measurement, registerHoverable} = context

  const handleLayout = useCallback(
    (evt: LayoutChangeEvent) => {
      if (!measurement) return // should be impossible

      const layout = evt.nativeEvent.layout

      registerHoverable(
        id,
        {
          width: layout.width,
          height: layout.height,
          y: measurement.y + measurement.height + tokens.space.xs + layout.y,
          x:
            align === 'left'
              ? measurement.x
              : measurement.x + measurement.width - layout.width,
        },
        () => {
          close()
          onPress()
        },
      )
    },
    [id, measurement, registerHoverable, close, onPress, align],
  )

  const itemContext = useMemo(
    () => ({disabled: Boolean(rest.disabled)}),
    [rest.disabled],
  )

  return (
    <Pressable
      {...rest}
      onLayout={handleLayout}
      accessibilityHint=""
      accessibilityLabel={label}
      onFocus={onFocus}
      onBlur={onBlur}
      onPress={e => {
        close()
        onPress?.(e)
      }}
      onPressIn={e => {
        onPressIn()
        rest.onPressIn?.(e)
        playHaptic('Light')
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
        (focused || pressed || context.hoveredMenuItem === id) &&
          !rest.disabled && [t.atoms.bg_contrast_50],
      ]}>
      <ItemContext.Provider value={itemContext}>
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
      size="md"
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

function getHoveredHoverable(
  evt:
    | GestureStateChangeEvent<PanGestureHandlerEventPayload>
    | GestureUpdateEvent<PanGestureHandlerEventPayload>,
  hoverables: SharedValue<Record<string, {id: string; rect: Measurement}>>,
  translation: SharedValue<number>,
) {
  'worklet'

  const x = evt.absoluteX
  const y = evt.absoluteY
  const yOffset = translation.get()

  const rects = Object.values(hoverables.get())

  for (const {id, rect} of rects) {
    const isWithinLeftBound = x >= rect.x
    const isWithinRightBound = x <= rect.x + rect.width
    const isWithinTopBound = y >= rect.y + yOffset
    const isWithinBottomBound = y <= rect.y + rect.height + yOffset

    if (
      isWithinLeftBound &&
      isWithinRightBound &&
      isWithinTopBound &&
      isWithinBottomBound
    ) {
      return id
    }
  }

  return null
}

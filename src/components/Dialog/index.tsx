import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Keyboard,
  type KeyboardEventListener,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type StyleProp,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native'
import {useReanimatedKeyboardAnimation} from 'react-native-keyboard-controller'
import Animated, {
  runOnJS,
  type ScrollEvent,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {ScrollProvider} from '#/lib/ScrollContext'
import {logger} from '#/logger'
import {useA11y} from '#/state/a11y'
import {useDialogStateControlContext} from '#/state/dialogs'
import {List, type ListMethods, type ListProps} from '#/view/com/util/List'
import {android, atoms as a, ios, platform, tokens, useTheme} from '#/alf'
import {useThemeName} from '#/alf/util/useColorModeTheme'
import {Context, useDialogContext} from '#/components/Dialog/context'
import {
  type DialogControlProps,
  type DialogInnerProps,
  type DialogOuterProps,
} from '#/components/Dialog/types'
import {createInput} from '#/components/forms/TextField'
import {useOnKeyboard} from '#/components/hooks/useOnKeyboard'
import {IS_ANDROID, IS_IOS, IS_LIQUID_GLASS} from '#/env'
import {BottomSheet, BottomSheetSnapPoint} from '../../../modules/bottom-sheet'
import {
  type BottomSheetSnapPointChangeEvent,
  type BottomSheetStateChangeEvent,
} from '../../../modules/bottom-sheet/src/BottomSheet.types'
import {type BottomSheetNativeComponent} from '../../../modules/bottom-sheet/src/BottomSheetNativeComponent'

export {useDialogContext, useDialogControl} from '#/components/Dialog/context'
export * from '#/components/Dialog/shared'
export * from '#/components/Dialog/types'
export * from '#/components/Dialog/utils'

export const Input = createInput(TextInput)

export function Outer({
  children,
  control,
  onClose,
  nativeOptions,
  testID,
}: React.PropsWithChildren<DialogOuterProps>) {
  const themeName = useThemeName()
  const t = useTheme(themeName)
  const ref = useRef<BottomSheetNativeComponent>(null)
  const closeCallbacks = useRef<(() => void)[]>([])
  const {setDialogIsOpen, setFullyExpandedCount} =
    useDialogStateControlContext()

  const prevSnapPoint = useRef<BottomSheetSnapPoint>(
    BottomSheetSnapPoint.Hidden,
  )

  const [disableDrag, setDisableDrag] = useState(false)
  const [snapPoint, setSnapPoint] = useState<BottomSheetSnapPoint>(
    BottomSheetSnapPoint.Partial,
  )

  const callQueuedCallbacks = useCallback(() => {
    for (const cb of closeCallbacks.current) {
      try {
        cb()
      } catch (e: any) {
        logger.error(e || 'Error running close callback')
      }
    }

    closeCallbacks.current = []
  }, [])

  const open = useCallback<DialogControlProps['open']>(() => {
    // Run any leftover callbacks that might have been queued up before calling `.open()`
    callQueuedCallbacks()
    setDialogIsOpen(control.id, true)
    ref.current?.present()
  }, [setDialogIsOpen, control.id, callQueuedCallbacks])

  // This is the function that we call when we want to dismiss the dialog.
  const close = useCallback<DialogControlProps['close']>(cb => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb)
    }
    ref.current?.dismiss()
  }, [])

  // This is the actual thing we are doing once we "confirm" the dialog. We want the dialog's close animation to
  // happen before we run this. It is passed to the `BottomSheet` component.
  const onCloseAnimationComplete = useCallback(() => {
    // This removes the dialog from our list of stored dialogs. Not super necessary on iOS, but on Android this
    // tells us that we need to toggle the accessibility overlay setting
    setDialogIsOpen(control.id, false)
    callQueuedCallbacks()
    onClose?.()
  }, [callQueuedCallbacks, control.id, onClose, setDialogIsOpen])

  const onSnapPointChange = (e: BottomSheetSnapPointChangeEvent) => {
    const {snapPoint} = e.nativeEvent
    setSnapPoint(snapPoint)

    if (
      snapPoint === BottomSheetSnapPoint.Full &&
      prevSnapPoint.current !== BottomSheetSnapPoint.Full
    ) {
      setFullyExpandedCount(c => c + 1)
    } else if (
      snapPoint !== BottomSheetSnapPoint.Full &&
      prevSnapPoint.current === BottomSheetSnapPoint.Full
    ) {
      setFullyExpandedCount(c => c - 1)
    }
    prevSnapPoint.current = snapPoint
  }

  const onStateChange = (e: BottomSheetStateChangeEvent) => {
    if (e.nativeEvent.state === 'closed') {
      onCloseAnimationComplete()

      if (prevSnapPoint.current === BottomSheetSnapPoint.Full) {
        setFullyExpandedCount(c => c - 1)
      }
      prevSnapPoint.current = BottomSheetSnapPoint.Hidden
    }
  }

  useImperativeHandle(
    control.ref,
    () => ({
      open,
      close,
    }),
    [open, close],
  )

  const context = useMemo(
    () => ({
      close,
      isNativeDialog: true,
      nativeSnapPoint: snapPoint,
      disableDrag,
      setDisableDrag,
      isWithinDialog: true,
    }),
    [close, snapPoint, disableDrag, setDisableDrag],
  )

  return (
    <BottomSheet
      ref={ref}
      // device-bezel radius when undefined
      cornerRadius={IS_LIQUID_GLASS ? undefined : 20}
      backgroundColor={t.atoms.bg.backgroundColor}
      {...nativeOptions}
      onSnapPointChange={onSnapPointChange}
      onStateChange={onStateChange}
      disableDrag={disableDrag}>
      <Context.Provider value={context}>
        <View testID={testID} style={[a.relative]}>
          {children}
        </View>
      </Context.Provider>
    </BottomSheet>
  )
}

/**
 * @deprecated use `Dialog.ScrollableInner` instead
 */
export function Inner({children, style, header}: DialogInnerProps) {
  const insets = useSafeAreaInsets()
  return (
    <>
      {header}
      <View
        style={[
          a.pt_2xl,
          a.px_xl,
          IS_LIQUID_GLASS
            ? a.pb_2xl
            : {paddingBottom: insets.bottom + insets.top},
          style,
        ]}>
        {children}
      </View>
    </>
  )
}

export const ScrollableInner = forwardRef<ScrollView, DialogInnerProps>(
  function ScrollableInner(
    {children, contentContainerStyle, header, ...props},
    ref,
  ) {
    const {nativeSnapPoint, disableDrag, setDisableDrag} = useDialogContext()
    const isAtMaxSnapPoint = nativeSnapPoint === BottomSheetSnapPoint.Full
    const insets = useSafeAreaInsets()
    const [keyboardHeight, setKeyboardHeight] = useState(() =>
      IS_ANDROID ? (Keyboard.metrics()?.height ?? 0) : 0,
    )

    const keyboardEventHandler = useCallback<KeyboardEventListener>(e => {
      setKeyboardHeight(e.endCoordinates.height)
    }, [])
    useOnKeyboard('keyboardDidShow', keyboardEventHandler)
    useOnKeyboard('keyboardDidHide', keyboardEventHandler)

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!IS_ANDROID) {
        return
      }
      const {contentOffset} = e.nativeEvent
      if (contentOffset.y > 0 && !disableDrag) {
        setDisableDrag(true)
      } else if (contentOffset.y <= 1 && disableDrag) {
        setDisableDrag(false)
      }
    }

    return (
      <ScrollView
        contentContainerStyle={[
          a.pt_2xl,
          IS_LIQUID_GLASS ? a.px_2xl : a.px_xl,
          platform({
            ios: a.pb_2xl,
            android: {
              paddingBottom: keyboardHeight + insets.bottom + tokens.space.xl,
            },
          }),
          contentContainerStyle,
        ]}
        ref={ref}
        showsVerticalScrollIndicator={IS_ANDROID ? false : undefined}
        contentInsetAdjustmentBehavior={
          isAtMaxSnapPoint ? 'automatic' : 'never'
        }
        automaticallyAdjustKeyboardInsets={isAtMaxSnapPoint}
        {...props}
        bounces={isAtMaxSnapPoint}
        scrollEventThrottle={50}
        // set drag state based on scroll on android.
        // we want to detect if it's at the top or not, so watch
        // scrollEndDrag and momentumScrollEnd as well
        onScroll={android(onScroll)}
        onScrollEndDrag={android(onScroll)}
        onMomentumScrollEnd={android(onScroll)}
        keyboardShouldPersistTaps="handled"
        // TODO: figure out why this positions the header absolutely (rather than stickily)
        // on Android. fine to disable for now, because we don't have any
        // dialogs that use this that actually scroll -sfn
        stickyHeaderIndices={ios(header ? [0] : undefined)}>
        {header}
        {children}
      </ScrollView>
    )
  },
)

export const InnerFlatList = forwardRef<
  ListMethods,
  ListProps<any> & {
    webInnerStyle?: StyleProp<ViewStyle>
    webInnerContentContainerStyle?: StyleProp<ViewStyle>
    footer?: React.ReactNode
  }
>(function InnerFlatList(
  {headerOffset, footer, style, contentContainerStyle, ...props},
  ref,
) {
  const insets = useSafeAreaInsets()
  const {nativeSnapPoint, disableDrag, setDisableDrag} = useDialogContext()

  const isAtMaxSnapPoint = nativeSnapPoint === BottomSheetSnapPoint.Full

  const onScroll = (e: ScrollEvent) => {
    'worklet'
    if (!IS_ANDROID) {
      return
    }
    const {contentOffset} = e
    if (contentOffset.y > 0 && !disableDrag) {
      runOnJS(setDisableDrag)(true)
    } else if (contentOffset.y <= 1 && disableDrag) {
      runOnJS(setDisableDrag)(false)
    }
  }

  return (
    <ScrollProvider
      onScroll={onScroll}
      onEndDrag={onScroll}
      onMomentumEnd={onScroll}>
      <List
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior={
          isAtMaxSnapPoint ? 'automatic' : 'never'
        }
        automaticallyAdjustKeyboardInsets={isAtMaxSnapPoint}
        scrollIndicatorInsets={{top: headerOffset}}
        bounces={isAtMaxSnapPoint}
        ref={ref}
        showsVerticalScrollIndicator={IS_ANDROID ? false : undefined}
        {...props}
        style={[a.h_full, style]}
        contentContainerStyle={[
          {paddingTop: headerOffset},
          android({
            paddingBottom: insets.top + insets.bottom + tokens.space.xl,
          }),
          contentContainerStyle,
        ]}
      />
      {footer}
    </ScrollProvider>
  )
})

export function FlatListFooter({
  children,
  onLayout,
}: {
  children: React.ReactNode
  onLayout?: (event: LayoutChangeEvent) => void
}) {
  const t = useTheme()
  const {bottom} = useSafeAreaInsets()
  const {height} = useReanimatedKeyboardAnimation()

  const animatedStyle = useAnimatedStyle(() => {
    if (!IS_IOS) return {}
    return {
      transform: [{translateY: Math.min(0, height.get() + bottom - 10)}],
    }
  })

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        a.absolute,
        a.bottom_0,
        a.w_full,
        a.z_10,
        a.border_t,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.px_lg,
        a.pt_md,
        {paddingBottom: bottom + tokens.space.md},
        // TODO: had to admit defeat here, but we should
        // try and get this to work for Android as well -sfn
        ios(animatedStyle),
      ]}>
      {children}
    </Animated.View>
  )
}

export function Handle({
  difference = false,
  fill,
}: {
  difference?: boolean
  fill?: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {screenReaderEnabled} = useA11y()
  const {close} = useDialogContext()

  return (
    <View style={[a.absolute, a.w_full, a.align_center, a.z_10, {height: 20}]}>
      <Pressable
        accessible={screenReaderEnabled}
        onPress={() => close()}
        accessibilityLabel={_(msg`Dismiss`)}
        accessibilityHint={_(msg`Double tap to close the dialog`)}>
        <View
          style={[
            a.rounded_sm,
            {
              top: tokens.space._2xl / 2 - 2.5,
              width: 35,
              height: 5,
              alignSelf: 'center',
            },
            difference
              ? {
                  // TODO: mixBlendMode is only available on the new architecture -sfn
                  // backgroundColor: t.palette.white,
                  // mixBlendMode: 'difference',
                  backgroundColor: t.palette.white,
                  opacity: 0.75,
                }
              : {
                  backgroundColor: fill || t.palette.contrast_975,
                  opacity: 0.5,
                },
          ]}
        />
      </Pressable>
    </View>
  )
}

export function Close() {
  return null
}

export function Backdrop() {
  return null
}

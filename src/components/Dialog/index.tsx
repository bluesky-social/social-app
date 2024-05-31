import React, {useImperativeHandle} from 'react'
import {
  Dimensions,
  Keyboard,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import BottomSheet, {
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetFlatListMethods,
  BottomSheetScrollView,
  BottomSheetScrollViewMethods,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheet,
  WINDOW_HEIGHT,
} from '@discord/bottom-sheet/src'
import {BottomSheetFlatListProps} from '@discord/bottom-sheet/src/components/bottomSheetScrollable/types'

import {logger} from '#/logger'
import {useDialogStateControlContext} from '#/state/dialogs'
import {atoms as a, flatten, useTheme} from '#/alf'
import {Context} from '#/components/Dialog/context'
import {
  DialogControlProps,
  DialogInnerProps,
  DialogOuterProps,
} from '#/components/Dialog/types'
import {createInput} from '#/components/forms/TextField'
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
import {Portal} from '#/components/Portal'

export {useDialogContext, useDialogControl} from '#/components/Dialog/context'
export * from '#/components/Dialog/types'
// @ts-ignore
export const Input = createInput(BottomSheetTextInput)

function Backdrop(props: BottomSheetBackdropProps) {
  const t = useTheme()
  const bottomSheet = useBottomSheet()

  const animatedStyle = useAnimatedStyle(() => {
    const opacity =
      (Math.abs(WINDOW_HEIGHT - props.animatedPosition.value) - 50) / 1000

    return {
      opacity: Math.min(Math.max(opacity, 0), 0.55),
    }
  })

  const onPress = React.useCallback(() => {
    bottomSheet.close()
  }, [bottomSheet])

  return (
    <Animated.View
      style={[
        t.atoms.bg_contrast_300,
        {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          position: 'absolute',
        },
        animatedStyle,
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dialog backdrop"
        accessibilityHint="Press the backdrop to close the dialog"
        style={{flex: 1}}
        onPress={onPress}
      />
    </Animated.View>
  )
}

export function Outer({
  children,
  control,
  onClose,
  nativeOptions,
  testID,
}: React.PropsWithChildren<DialogOuterProps>) {
  const t = useTheme()
  const sheet = React.useRef<BottomSheet>(null)
  const sheetOptions = nativeOptions?.sheet || {}
  const hasSnapPoints = !!sheetOptions.snapPoints
  const insets = useSafeAreaInsets()
  const closeCallbacks = React.useRef<(() => void)[]>([])
  const {setDialogIsOpen} = useDialogStateControlContext()

  /*
   * Used to manage open/closed, but index is otherwise handled internally by `BottomSheet`
   */
  const [openIndex, setOpenIndex] = React.useState(-1)

  /*
   * `openIndex` is the index of the snap point to open the bottom sheet to. If >0, the bottom sheet is open.
   */
  const isOpen = openIndex > -1

  const callQueuedCallbacks = React.useCallback(() => {
    for (const cb of closeCallbacks.current) {
      try {
        cb()
      } catch (e: any) {
        logger.error('Error running close callback', e)
      }
    }

    closeCallbacks.current = []
  }, [])

  const open = React.useCallback<DialogControlProps['open']>(
    ({index} = {}) => {
      // Run any leftover callbacks that might have been queued up before calling `.open()`
      callQueuedCallbacks()

      setDialogIsOpen(control.id, true)
      // can be set to any index of `snapPoints`, but `0` is the first i.e. "open"
      setOpenIndex(index || 0)
      sheet.current?.snapToIndex(index || 0)
    },
    [setDialogIsOpen, control.id, callQueuedCallbacks],
  )

  // This is the function that we call when we want to dismiss the dialog.
  const close = React.useCallback<DialogControlProps['close']>(cb => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb)
    }
    sheet.current?.close()
  }, [])

  // This is the actual thing we are doing once we "confirm" the dialog. We want the dialog's close animation to
  // happen before we run this. It is passed to the `BottomSheet` component.
  const onCloseAnimationComplete = React.useCallback(() => {
    // This removes the dialog from our list of stored dialogs. Not super necessary on iOS, but on Android this
    // tells us that we need to toggle the accessibility overlay setting
    setDialogIsOpen(control.id, false)
    setOpenIndex(-1)

    callQueuedCallbacks()
    onClose?.()
  }, [callQueuedCallbacks, control.id, onClose, setDialogIsOpen])

  useImperativeHandle(
    control.ref,
    () => ({
      open,
      close,
    }),
    [open, close],
  )

  React.useEffect(() => {
    return () => {
      setDialogIsOpen(control.id, false)
    }
  }, [control.id, setDialogIsOpen])

  const context = React.useMemo(() => ({close}), [close])

  return (
    isOpen && (
      <Portal>
        <FullWindowOverlay>
          <View
            // iOS
            accessibilityViewIsModal
            // Android
            importantForAccessibility="yes"
            style={[a.absolute, a.inset_0]}
            testID={testID}
            onTouchMove={() => Keyboard.dismiss()}>
            <BottomSheet
              enableDynamicSizing={!hasSnapPoints}
              enablePanDownToClose
              keyboardBehavior="interactive"
              android_keyboardInputMode="adjustResize"
              keyboardBlurBehavior="restore"
              topInset={insets.top}
              {...sheetOptions}
              snapPoints={sheetOptions.snapPoints || ['100%']}
              ref={sheet}
              index={openIndex}
              backgroundStyle={{backgroundColor: 'transparent'}}
              backdropComponent={Backdrop}
              handleIndicatorStyle={{backgroundColor: t.palette.primary_500}}
              handleStyle={{display: 'none'}}
              onClose={onCloseAnimationComplete}>
              <Context.Provider value={context}>
                <View
                  style={[
                    a.absolute,
                    a.inset_0,
                    t.atoms.bg,
                    {
                      borderTopLeftRadius: 40,
                      borderTopRightRadius: 40,
                      height: Dimensions.get('window').height * 2,
                    },
                  ]}
                />
                {children}
              </Context.Provider>
            </BottomSheet>
          </View>
        </FullWindowOverlay>
      </Portal>
    )
  )
}

export function Inner({children, style}: DialogInnerProps) {
  const insets = useSafeAreaInsets()
  return (
    <BottomSheetView
      style={[
        a.py_xl,
        a.px_xl,
        {
          paddingTop: 40,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          paddingBottom: insets.bottom + a.pb_5xl.paddingBottom,
        },
        flatten(style),
      ]}>
      {children}
    </BottomSheetView>
  )
}

export const ScrollableInner = React.forwardRef<
  BottomSheetScrollViewMethods,
  DialogInnerProps
>(function ScrollableInner({children, style}, ref) {
  const insets = useSafeAreaInsets()
  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      style={[
        a.flex_1, // main diff is this
        a.p_xl,
        a.h_full,
        {
          paddingTop: 40,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
        },
        flatten(style),
      ]}
      contentContainerStyle={a.pb_4xl}
      ref={ref}>
      {children}
      <View style={{height: insets.bottom + a.pt_5xl.paddingTop}} />
    </BottomSheetScrollView>
  )
})

export const InnerFlatList = React.forwardRef<
  BottomSheetFlatListMethods,
  BottomSheetFlatListProps<any> & {webInnerStyle?: StyleProp<ViewStyle>}
>(function InnerFlatList({style, contentContainerStyle, ...props}, ref) {
  const insets = useSafeAreaInsets()

  return (
    <BottomSheetFlatList
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[a.pb_4xl, flatten(contentContainerStyle)]}
      ListFooterComponent={
        <View style={{height: insets.bottom + a.pt_5xl.paddingTop}} />
      }
      ref={ref}
      {...props}
      style={[
        a.flex_1,
        a.p_xl,
        a.pt_0,
        a.h_full,
        {
          marginTop: 40,
        },
        flatten(style),
      ]}
    />
  )
})

export function Handle() {
  const t = useTheme()

  return (
    <View style={[a.absolute, a.w_full, a.align_center, a.z_10, {height: 40}]}>
      <View
        style={[
          a.rounded_sm,
          {
            top: a.pt_lg.paddingTop,
            width: 35,
            height: 4,
            alignSelf: 'center',
            backgroundColor: t.palette.contrast_900,
            opacity: 0.5,
          },
        ]}
      />
    </View>
  )
}

export function Close() {
  return null
}

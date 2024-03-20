import React, {useImperativeHandle} from 'react'
import {View, Dimensions, Keyboard, Pressable} from 'react-native'
import BottomSheet, {
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheet,
  WINDOW_HEIGHT,
} from '@gorhom/bottom-sheet'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'

import {useTheme, atoms as a, flatten} from '#/alf'
import {Portal} from '#/components/Portal'
import {createInput} from '#/components/forms/TextField'
import {logger} from '#/logger'
import {useDialogStateControlContext} from '#/state/dialogs'

import {
  DialogOuterProps,
  DialogControlProps,
  DialogInnerProps,
} from '#/components/Dialog/types'
import {Context} from '#/components/Dialog/context'
import {isNative} from 'platform/detection'

export {useDialogControl, useDialogContext} from '#/components/Dialog/context'
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
  const closeCallback = React.useRef<() => void>()
  const {setDialogIsOpen} = useDialogStateControlContext()

  /*
   * Used to manage open/closed, but index is otherwise handled internally by `BottomSheet`
   */
  const [openIndex, setOpenIndex] = React.useState(-1)

  /*
   * `openIndex` is the index of the snap point to open the bottom sheet to. If >0, the bottom sheet is open.
   */
  const isOpen = openIndex > -1

  const open = React.useCallback<DialogControlProps['open']>(
    ({index} = {}) => {
      setDialogIsOpen(control.id, true)
      // can be set to any index of `snapPoints`, but `0` is the first i.e. "open"
      setOpenIndex(index || 0)
    },
    [setOpenIndex, setDialogIsOpen, control.id],
  )

  const close = React.useCallback<DialogControlProps['close']>(cb => {
    if (cb && typeof cb === 'function') {
      closeCallback.current = cb
    }
    sheet.current?.close()
  }, [])

  useImperativeHandle(
    control.ref,
    () => ({
      open,
      close,
    }),
    [open, close],
  )

  const onCloseInner = React.useCallback(() => {
    Keyboard.dismiss()
    try {
      closeCallback.current?.()
    } catch (e: any) {
      logger.error(`Dialog closeCallback failed`, {
        message: e.message,
      })
    } finally {
      closeCallback.current = undefined
    }
    setDialogIsOpen(control.id, false)
    onClose?.()
    setOpenIndex(-1)
  }, [control.id, onClose, setDialogIsOpen])

  const context = React.useMemo(() => ({close}), [close])

  return (
    isOpen && (
      <Portal>
        <View
          // iOS
          accessibilityViewIsModal
          // Android
          importantForAccessibility="yes"
          style={[a.absolute, a.inset_0]}
          testID={testID}>
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
            onClose={onCloseInner}>
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
      </Portal>
    )
  )
}

export function Inner({children, style}: DialogInnerProps) {
  const insets = useSafeAreaInsets()
  return (
    <BottomSheetView
      style={[
        a.p_xl,
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

export function ScrollableInner({
  children,
  keyboardDismissMode,
  style,
}: DialogInnerProps) {
  const insets = useSafeAreaInsets()
  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={keyboardDismissMode || 'on-drag'}
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
      contentContainerStyle={isNative ? a.pb_4xl : undefined}>
      {children}
      <View style={{height: insets.bottom + a.pt_5xl.paddingTop}} />
    </BottomSheetScrollView>
  )
}

export function Handle() {
  const t = useTheme()

  const onTouchStart = React.useCallback(() => {
    Keyboard.dismiss()
  }, [])

  return (
    <View
      style={[a.absolute, a.w_full, a.align_center, a.z_10, {height: 40}]}
      onTouchStart={onTouchStart}>
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

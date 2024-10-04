import React, {useImperativeHandle} from 'react'
import {
  Pressable,
  ScrollView,
  StyleProp,
  TextInput,
  View,
  ViewStyle,
} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useA11y} from '#/state/a11y'
import {useDialogStateControlContext} from '#/state/dialogs'
import {List, ListMethods, ListProps} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Context, useDialogContext} from '#/components/Dialog/context'
import {
  DialogControlProps,
  DialogInnerProps,
  DialogOuterProps,
} from '#/components/Dialog/types'
import {createInput} from '#/components/forms/TextField'
import {Portal as DefaultPortal} from '#/components/Portal'
import {BottomSheet, BottomSheetSnapPoint} from '../../../modules/bottom-sheet'

export {useDialogContext, useDialogControl} from '#/components/Dialog/context'
export * from '#/components/Dialog/types'
export * from '#/components/Dialog/utils'
// @ts-ignore
export const Input = createInput(TextInput)

export function Outer({
  children,
  control,
  onClose,
  nativeOptions,
  testID,
  Portal = DefaultPortal,
}: React.PropsWithChildren<DialogOuterProps>) {
  const t = useTheme()
  const ref = React.useRef<BottomSheet>(null)
  const insets = useSafeAreaInsets()
  const closeCallbacks = React.useRef<(() => void)[]>([])
  const {setDialogIsOpen} = useDialogStateControlContext()

  const [snapPoint, setSnapPoint] = React.useState<BottomSheetSnapPoint>(
    BottomSheetSnapPoint.Partial,
  )

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

  const open = React.useCallback<DialogControlProps['open']>(() => {
    // Run any leftover callbacks that might have been queued up before calling `.open()`
    callQueuedCallbacks()
    setDialogIsOpen(control.id, true)
    ref.current?.present()
  }, [setDialogIsOpen, control.id, callQueuedCallbacks])

  // This is the function that we call when we want to dismiss the dialog.
  const close = React.useCallback<DialogControlProps['close']>(cb => {
    if (typeof cb === 'function') {
      closeCallbacks.current.push(cb)
    }
    ref.current?.dismiss()
  }, [])

  // This is the actual thing we are doing once we "confirm" the dialog. We want the dialog's close animation to
  // happen before we run this. It is passed to the `BottomSheet` component.
  const onCloseAnimationComplete = React.useCallback(() => {
    // This removes the dialog from our list of stored dialogs. Not super necessary on iOS, but on Android this
    // tells us that we need to toggle the accessibility overlay setting
    setDialogIsOpen(control.id, false)
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

  const context = React.useMemo(
    () => ({close, isNativeDialog: true, nativeSnapPoint: snapPoint}),
    [close, snapPoint],
  )

  return (
    <Portal>
      <Context.Provider value={context}>
        <BottomSheet
          ref={ref}
          onSnapPointChange={e => {
            setSnapPoint(e.nativeEvent.snapPoint)
          }}
          onStateChange={e => {
            if (e.nativeEvent.state === 'closed') {
              onCloseAnimationComplete()
            }
          }}
          cornerRadius={20}
          topInset={insets.top}
          bottomInset={insets.bottom}
          {...nativeOptions}>
          <View testID={testID} style={[t.atoms.bg]}>
            {children}
          </View>
        </BottomSheet>
      </Context.Provider>
    </Portal>
  )
}

export function Inner({children, style}: DialogInnerProps) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        a.pt_2xl,
        a.px_xl,
        {
          paddingBottom: insets.bottom + insets.top,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export const ScrollableInner = React.forwardRef<ScrollView, DialogInnerProps>(
  function ScrollableInner({children, style, ...props}, ref) {
    const {nativeSnapPoint} = useDialogContext()
    const insets = useSafeAreaInsets()
    return (
      <KeyboardAwareScrollView
        style={[a.pt_2xl, a.px_xl, style]}
        contentContainerStyle={
          nativeSnapPoint === BottomSheetSnapPoint.Full && [
            {paddingBottom: insets.bottom + insets.top},
          ]
        }
        ref={ref}
        {...props}
        bounces={nativeSnapPoint === BottomSheetSnapPoint.Full}
        bottomOffset={30}>
        {children}
      </KeyboardAwareScrollView>
    )
  },
)

export const InnerFlatList = React.forwardRef<
  ListMethods,
  ListProps<any> & {webInnerStyle?: StyleProp<ViewStyle>}
>(function InnerFlatList({style, ...props}, ref) {
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const {nativeSnapPoint} = useDialogContext()
  return (
    <>
      <View style={[a.w_full, t.atoms.bg, {height: a.pt_sm.paddingTop}]} />
      <List
        keyboardShouldPersistTaps="handled"
        bounces={nativeSnapPoint === BottomSheetSnapPoint.Full}
        ListFooterComponent={
          <View style={{height: insets.bottom + a.pt_5xl.paddingTop}} />
        }
        ref={ref}
        {...props}
        style={[style]}
      />
    </>
  )
})

export function Handle() {
  const t = useTheme()
  const {_} = useLingui()
  const {screenReaderEnabled} = useA11y()
  const {close} = useDialogContext()

  return (
    <View style={[a.w_full, a.align_center, a.z_10, t.atoms.bg, {height: 20}]}>
      <Pressable
        accessible={screenReaderEnabled}
        onPress={() => close()}
        accessibilityLabel={_(msg`Dismiss`)}
        accessibilityHint={_(msg`Double tap to close the dialog`)}>
        <View
          style={[
            a.rounded_sm,
            {
              top: 10,
              width: 35,
              height: 5,
              alignSelf: 'center',
              backgroundColor: t.palette.contrast_975,
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

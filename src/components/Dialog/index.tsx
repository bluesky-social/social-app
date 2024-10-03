import React, {useImperativeHandle} from 'react'
import {StyleProp, TextInput, View, ViewStyle} from 'react-native'
import {GestureHandlerRootView, ScrollView} from 'react-native-gesture-handler'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'
import {useDialogStateControlContext} from '#/state/dialogs'
import {List, ListMethods, ListProps} from '#/view/com/util/List'
import {atoms as a, flatten, useTheme} from '#/alf'
import {Context, useDialogContext} from '#/components/Dialog/context'
import {
  DialogControlProps,
  DialogInnerProps,
  DialogOuterProps,
} from '#/components/Dialog/types'
import {createInput} from '#/components/forms/TextField'
import {Portal} from '#/components/Portal'
import {
  BottomSheetSnapPoint,
  BottomSheetView,
} from '../../../modules/bottom-sheet'

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
}: React.PropsWithChildren<DialogOuterProps>) {
  return (
    <Portal>
      <OuterWithoutPortal
        control={control}
        onClose={onClose}
        nativeOptions={nativeOptions}
        testID={testID}>
        {children}
      </OuterWithoutPortal>
    </Portal>
  )
}

export function OuterWithoutPortal({
  children,
  control,
  onClose,
  nativeOptions,
  testID,
}: React.PropsWithChildren<DialogOuterProps>) {
  const t = useTheme()
  const ref = React.useRef<BottomSheetView>(null)
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
    () => ({close, insideDialog: true, snapPoint}),
    [close, snapPoint],
  )

  const Wrapper = isIOS ? View : GestureHandlerRootView

  return (
    <Context.Provider value={context}>
      <BottomSheetView
        ref={ref}
        topInset={30}
        bottomInset={insets.bottom}
        onSnapPointChange={e => {
          console.log(e.nativeEvent)
          setSnapPoint(e.nativeEvent.snapPoint)
        }}
        onStateChange={e => {
          if (e.nativeEvent.state === 'closed') {
            onCloseAnimationComplete()
          }
        }}
        cornerRadius={20}
        {...nativeOptions}>
        <Wrapper testID={testID} style={[t.atoms.bg]}>
          {children}
        </Wrapper>
      </BottomSheetView>
    </Context.Provider>
  )
}

export function Inner({children, style}: DialogInnerProps) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        a.px_xl,
        {
          paddingBottom: insets.bottom + a.pb_5xl.paddingBottom,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export const ScrollableInner = React.forwardRef<ScrollView, DialogInnerProps>(
  function ScrollableInner({children, style}, ref) {
    const insets = useSafeAreaInsets()
    const {snapPoint} = useDialogContext()
    return (
      <ScrollView
        style={[a.px_xl, style]}
        ref={ref}
        bounces={snapPoint === BottomSheetSnapPoint.Full}>
        {children}
        <View style={{height: insets.bottom + a.pt_5xl.paddingTop}} />
      </ScrollView>
    )
  },
)

export const InnerFlatList = React.forwardRef<
  ListMethods,
  ListProps<any> & {webInnerStyle?: StyleProp<ViewStyle>}
>(function InnerFlatList({style, contentContainerStyle, ...props}, ref) {
  const insets = useSafeAreaInsets()
  return (
    <List
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[a.pb_4xl, flatten(contentContainerStyle)]}
      ListFooterComponent={
        <View style={{height: insets.bottom + a.pt_5xl.paddingTop}} />
      }
      ref={ref}
      {...props}
      style={style}
    />
  )
})

export function Close() {
  return null
}

import React, {useImperativeHandle} from 'react'
import {StyleProp, TextInput, View, ViewStyle} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {BlueskyBottomSheetView} from '@haileyok/bluesky-bottom-sheet'

import {logger} from '#/logger'
import {useDialogStateControlContext} from '#/state/dialogs'
import {List, ListMethods, ListProps} from '#/view/com/util/List'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a, flatten, useTheme} from '#/alf'
import {Context} from '#/components/Dialog/context'
import {
  DialogControlProps,
  DialogInnerProps,
  DialogOuterProps,
} from '#/components/Dialog/types'
import {createInput} from '#/components/forms/TextField'
import {Portal} from '#/components/Portal'

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
  const t = useTheme()
  const ref = React.useRef<BlueskyBottomSheetView>(null)
  const insets = useSafeAreaInsets()
  const closeCallbacks = React.useRef<(() => void)[]>([])
  const {setDialogIsOpen} = useDialogStateControlContext()

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

  const context = React.useMemo(() => ({close}), [close])

  return (
    <Portal>
      <Context.Provider value={context}>
        <BlueskyBottomSheetView
          ref={ref}
          topInset={30}
          bottomInset={insets.bottom}
          onStateChange={e => {
            if (e.nativeEvent.state === 'closed') {
              onCloseAnimationComplete()
            }
          }}
          cornerRadius={20}
          {...nativeOptions}>
          <View testID={testID} style={[t.atoms.bg]}>
            {children}
          </View>
        </BlueskyBottomSheetView>
      </Context.Provider>
    </Portal>
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
    return (
      <ScrollView style={[a.px_xl, style]} ref={ref}>
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

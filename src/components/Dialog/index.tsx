import React, {useImperativeHandle} from 'react'
import {View, Dimensions} from 'react-native'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {useTheme, atoms as a, flatten} from '#/alf'
import {Portal} from '#/components/Portal'
import {createInput} from '#/components/forms/TextField'

import {
  DialogOuterProps,
  DialogControlProps,
  DialogInnerProps,
} from '#/components/Dialog/types'
import {Context} from '#/components/Dialog/context'

export {useDialogControl, useDialogContext} from '#/components/Dialog/context'
export * from '#/components/Dialog/types'
// @ts-ignore
export const Input = createInput(BottomSheetTextInput)

export function Outer({
  children,
  control,
  onClose,
  nativeOptions,
}: React.PropsWithChildren<DialogOuterProps>) {
  const t = useTheme()
  const sheet = React.useRef<BottomSheet>(null)
  const sheetOptions = nativeOptions?.sheet || {}
  const hasSnapPoints = !!sheetOptions.snapPoints
  const insets = useSafeAreaInsets()
  const closeCallback = React.useRef<() => void>()

  const tempIndex = React.useRef<number | undefined>()

  const [isOpen, setIsOpen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  const open = React.useCallback<DialogControlProps['open']>(
    ({index} = {}) => {
      tempIndex.current = index || 0
      // can be set to any index of `snapPoints`, but `0` is the first i.e. "open"
      setIsOpen(true)
    },
    [setIsOpen],
  )

  const close = React.useCallback<DialogControlProps['close']>(cb => {
    if (cb) {
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

  React.useEffect(() => {
    console.log({isOpen, isMounted, index: tempIndex.current})
    if (isMounted && tempIndex.current !== undefined) {
      const idx = tempIndex.current
      setTimeout(() => {
        sheet.current?.snapToIndex(idx)
      }, 100)
      tempIndex.current = undefined
    }
  }, [isOpen, isMounted])

  const onChange = React.useCallback(
    (index: number) => {
      if (index === -1) {
        closeCallback.current?.()
        closeCallback.current = undefined
        onClose?.()
        tempIndex.current = undefined
        setIsOpen(false)
        setIsMounted(false)
      }
    },
    [onClose, setIsOpen],
  )

  const context = React.useMemo(() => ({close}), [close])

  return (
    isOpen && (
      <Portal>
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
          index={-1}
          backgroundStyle={{backgroundColor: 'transparent'}}
          backdropComponent={props => (
            <BottomSheetBackdrop
              opacity={0.4}
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              {...props}
              style={[flatten(props.style), t.atoms.bg_contrast_300]}
            />
          )}
          handleIndicatorStyle={{backgroundColor: t.palette.primary_500}}
          handleStyle={{display: 'none'}}
          onChange={onChange}>
          <Context.Provider value={context}>
            <View
              onLayout={() => setIsMounted(true)}
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

export function ScrollableInner({children, style}: DialogInnerProps) {
  const insets = useSafeAreaInsets()
  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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
      ]}>
      {children}
      <View style={{height: insets.bottom + a.pt_5xl.paddingTop}} />
    </BottomSheetScrollView>
  )
}

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

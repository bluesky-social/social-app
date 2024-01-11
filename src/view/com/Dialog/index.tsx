import React, {useImperativeHandle} from 'react'
import {View, Dimensions} from 'react-native'
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet'

import {useTheme, atoms as a} from '#/alf'
import {Portal} from '#/view/com/Portal'

import {DialogProps, DialogControl} from '#/view/com/Dialog/types'

const Context = React.createContext<{
  close: () => void
}>({
  close: () => {},
})

export function useDialogControl() {
  const control = React.useRef<DialogControl>({
    open: () => {},
    close: () => {},
  })

  return control
}

export function useDialog() {
  return React.useContext(Context)
}

export function Outer({
  control,
  onClose,
  children,
}: React.PropsWithChildren<DialogProps>) {
  const t = useTheme()
  const sheet = React.useRef<BottomSheet>(null)

  const open = React.useCallback<DialogControl['open']>((i = 0) => {
    sheet.current?.snapToIndex(i)
  }, [])

  const close = React.useCallback(() => {
    sheet.current?.close()
    onClose?.()
  }, [onClose])

  useImperativeHandle(
    control,
    () => ({
      open,
      close,
    }),
    [open, close],
  )

  return (
    <Portal>
      <BottomSheet
        ref={sheet}
        index={-1}
        snapPoints={['90%']}
        enablePanDownToClose
        keyboardBehavior="extend"
        backgroundStyle={{backgroundColor: 'transparent'}}
        android_keyboardInputMode="adjustResize"
        backdropComponent={props => (
          <BottomSheetBackdrop
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            {...props}
          />
        )}
        handleIndicatorStyle={{backgroundColor: t.palette.primary}}
        handleStyle={{display: 'none'}}
        onChange={() => {}}
        onClose={onClose}>
        {children}
      </BottomSheet>
    </Portal>
  )
}

export function Inner(props: React.PropsWithChildren<{}>) {
  const t = useTheme()
  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        a.p_lg,
        a.pt_xxl,
        t.atoms.bg,
        {
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          height: Dimensions.get('window').height * 2,
        },
      ]}>
      {props.children}
    </View>
  )
}

export function Handle() {
  const t = useTheme()
  return (
    <View
      style={[
        a.absolute,
        a.rounded_sm,
        a.z_10,
        t.atoms.bg_contrast_200,
        {
          top: 12,
          width: 80,
          height: 6,
          alignSelf: 'center',
        },
      ]}
    />
  )
}

export function Close() {
  return null
}

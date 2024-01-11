import React, {useImperativeHandle} from 'react'
import {View, Dimensions} from 'react-native'
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet'

import {useTheme, atoms as a} from '#/alf'
import {Portal} from '#/view/com/Portal'

import {
  DialogOuterProps,
  DialogControlProps,
  DialogInnerProps,
} from '#/view/com/Dialog/types'
import {Context} from '#/view/com/Dialog/context'

export {useDialogControl} from '#/view/com/Dialog/context'

export function Outer({
  control,
  onClose,
  children,
}: React.PropsWithChildren<DialogOuterProps>) {
  const t = useTheme()
  const sheet = React.useRef<BottomSheet>(null)

  const open = React.useCallback<DialogControlProps['open']>((i = 0) => {
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

  const context = React.useMemo(() => ({close}), [close])

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
        <Context.Provider value={context}>{children}</Context.Provider>
      </BottomSheet>
    </Portal>
  )
}

export function Inner(props: DialogInnerProps) {
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

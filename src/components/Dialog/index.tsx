import React, {useImperativeHandle} from 'react'
import {View, Dimensions} from 'react-native'
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet'

import {useTheme, atoms as a} from '#/alf'
import {Portal} from '#/components/Portal'

import {
  DialogOuterProps,
  DialogControlProps,
  DialogInnerProps,
} from '#/components/Dialog/types'
import {Context} from '#/components/Dialog/context'

export {useDialogControl, useDialogContext} from '#/components/Dialog/context'
export * from '#/components/Dialog/types'

export function Outer({
  children,
  control,
  onClose,
  nativeOptions,
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
      <BottomSheet
        snapPoints={['90%']}
        enablePanDownToClose
        keyboardBehavior="extend"
        android_keyboardInputMode="adjustResize"
        {...(nativeOptions?.sheet || {})}
        ref={sheet}
        index={-1}
        backgroundStyle={{backgroundColor: 'transparent'}}
        backdropComponent={props => (
          <BottomSheetBackdrop
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            {...props}
          />
        )}
        handleIndicatorStyle={{backgroundColor: t.palette.primary_500}}
        handleStyle={{display: 'none'}}
        onClose={onClose}>
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
    </Portal>
  )
}

// TODO a11y props here, or is that handled by the sheet?
export function Inner(props: DialogInnerProps) {
  return (
    <View
      style={[
        a.p_lg,
        a.pt_3xl,
        {
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
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
          width: 50,
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

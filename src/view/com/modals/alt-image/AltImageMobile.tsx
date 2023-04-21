import React, {useCallback, useEffect, useRef} from 'react'
import * as AltImageModal from './AltImage'
import BottomSheet from '@gorhom/bottom-sheet'
import {createCustomBackdrop} from 'view/com/util/BottomSheetCustomBackdrop'
import {useStores} from 'state/index'
import {observer} from 'mobx-react-lite'
import {isNative} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {StyleSheet} from 'react-native'

export const AltImageModalMobile = observer(() => {
  const store = useStores()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const pal = usePalette('default')
  const {activeModals} = store.shell

  const activeModal = activeModals[activeModals.length - 1]

  useEffect(() => {
    if (store.shell.isModalActive) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [store.shell.isModalActive, bottomSheetRef, activeModal?.name])

  const onBottomSheetChange = (snapPoint: number) => {
    if (snapPoint === -1) {
      store.shell.closeModal()
    }
  }

  const onClose = useCallback(() => {
    bottomSheetRef.current?.close()
    store.shell.closeModal()
  }, [bottomSheetRef, store.shell])

  if (!isNative || activeModal?.name !== 'alt-text-image') {
    return null
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={AltImageModal.snapPoints}
      index={store.shell.isModalActive ? 0 : -1}
      enablePanDownToClose
      keyboardBehavior="fillParent"
      backdropComponent={
        store.shell.isModalActive ? createCustomBackdrop(onClose) : undefined
      }
      handleIndicatorStyle={{backgroundColor: pal.text.color}}
      handleStyle={[styles.handle, pal.view]}
      onChange={onBottomSheetChange}>
      <AltImageModal.Component {...activeModal} />
    </BottomSheet>
  )
})

const styles = StyleSheet.create({
  handle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
})

import React, {forwardRef, useState, useImperativeHandle, useRef} from 'react'
import {Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import BottomSheet from '@gorhom/bottom-sheet'
import Toast from '../util/Toast'
import Clipboard from '@react-native-clipboard/clipboard'
import {s} from '../../lib/styles'
import {createCustomBackdrop} from '../util/BottomSheetCustomBackdrop'

export const ShareModal = forwardRef(function ShareModal({}: {}, ref) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uri, setUri] = useState<string>('')
  const bottomSheetRef = useRef<BottomSheet>(null)

  useImperativeHandle(ref, () => ({
    open(uri: string) {
      console.log('sharing', uri)
      setUri(uri)
      setIsOpen(true)
      bottomSheetRef.current?.expand()
    },
  }))

  const onPressCopy = () => {
    Clipboard.setString(uri)
    console.log('showing')
    Toast.show('Link copied', {
      position: Toast.positions.TOP,
    })
  }
  const onShareBottomSheetChange = (snapPoint: number) => {
    if (snapPoint === -1) {
      console.log('unsharing')
      setIsOpen(false)
    }
  }
  const onClose = () => {
    bottomSheetRef.current?.close()
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['50%']}
      enablePanDownToClose
      backdropComponent={isOpen ? createCustomBackdrop(onClose) : undefined}
      onChange={onShareBottomSheetChange}>
      <View>
        <Text style={[s.textCenter, s.bold, s.mb10]}>Share this post</Text>
        <Text style={[s.textCenter, s.mb10]}>{uri}</Text>
        <Button title="Copy to clipboard" onPress={onPressCopy} />
        <View style={s.p10}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={s.textCenter}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  )
})

const styles = StyleSheet.create({
  closeBtn: {
    width: '100%',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
})

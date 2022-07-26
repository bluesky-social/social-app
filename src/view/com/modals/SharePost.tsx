import React, {forwardRef, useState, useImperativeHandle} from 'react'
import {Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {Modal} from './WebModal'
import Toast from '../util/Toast'
import {s} from '../../lib/styles'

export const ShareModal = forwardRef(function ShareModal({}: {}, ref) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uri, setUri] = useState<string>('')

  useImperativeHandle(ref, () => ({
    open(uri: string) {
      console.log('sharing', uri)
      setUri(uri)
      setIsOpen(true)
    },
  }))

  const onPressCopy = () => {
    // TODO
    Toast.show('Link copied', {
      position: Toast.positions.TOP,
    })
  }
  const onClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      {isOpen && (
        <Modal onClose={onClose}>
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
        </Modal>
      )}
    </>
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

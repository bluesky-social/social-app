import React from 'react'
import {Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import Toast from '../util/Toast'
import Clipboard from '@react-native-clipboard/clipboard'
import {s} from '../../lib/styles'
import {useStores} from '../../../state'

export const snapPoints = ['30%']

export function Component({href}: {href: string}) {
  const store = useStores()
  const onPressCopy = () => {
    Clipboard.setString(href)
    Toast.show('Link copied', {
      position: Toast.positions.TOP,
    })
    store.shell.closeModal()
  }
  const onClose = () => store.shell.closeModal()

  return (
    <View>
      <Text style={[s.textCenter, s.bold, s.mb10]}>Share this post</Text>
      <Text style={[s.textCenter, s.mb10]}>{href}</Text>
      <Button title="Copy to clipboard" onPress={onPressCopy} />
      <View style={s.p10}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={s.textCenter}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  closeBtn: {
    width: '100%',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
})

import React from 'react'
import Toast from '../util/Toast'
import Clipboard from '@react-native-clipboard/clipboard'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'

export const snapPoints = ['30%']

export function Component({title, href}: {title: string; href: string}) {
  const store = useStores()

  const onPressOpenNewTab = () => {
    store.shell.closeModal()
    store.nav.newTab(href)
  }

  const onPressCopy = () => {
    Clipboard.setString(href)
    store.shell.closeModal()
    Toast.show('Link copied', {
      position: Toast.positions.TOP,
    })
  }

  return (
    <View>
      <Text style={[s.textCenter, s.bold, s.mb10, s.f16]}>{title || href}</Text>
      <View style={s.p10}>
        <TouchableOpacity onPress={onPressOpenNewTab} style={styles.btn}>
          <FontAwesomeIcon
            icon="arrow-up-right-from-square"
            style={styles.icon}
          />
          <Text style={[s.f16, s.black]}>Open in new tab</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressCopy} style={styles.btn}>
          <FontAwesomeIcon icon="link" style={styles.icon} />
          <Text style={[s.f16, s.black]}>Copy to clipboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderColor: colors.gray5,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
  },
  icon: {
    marginRight: 8,
  },
})

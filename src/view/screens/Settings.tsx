import React, {useEffect} from 'react'
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useStores} from '../../state'
import {ScreenParams} from '../routes'
import {s, colors} from '../lib/styles'
import {DEF_AVATER} from '../lib/assets'
import {Link} from '../com/util/Link'

export const Settings = observer(function Settings({visible}: ScreenParams) {
  const store = useStores()

  useEffect(() => {
    if (!visible) {
      return
    }
    store.nav.setTitle('Settings')
  }, [visible, store])

  const onPressSignout = () => {
    store.session.logout()
  }

  return (
    <View style={[s.flex1, s.pl10, s.pr10]}>
      <Text style={styles.title}>Settings</Text>
      <View style={[s.flexRow]}>
        <Text>Signed in as</Text>
        <View style={s.flex1} />
        <TouchableOpacity onPress={onPressSignout}>
          <Text style={[s.blue3, s.bold]}>Sign out</Text>
        </TouchableOpacity>
      </View>
      <Link href={`/profile/${store.me.name}`} title="Your profile">
        <View style={styles.profile}>
          <Image style={styles.avi} source={DEF_AVATER} />
          <View>
            <Text style={[s.f18]}>{store.me.displayName}</Text>
            <Text style={[s.gray5]}>@{store.me.name}</Text>
          </View>
        </View>
      </Link>
    </View>
  )
})

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 14,
  },
  profile: {
    flexDirection: 'row',
    marginVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 8,
  },
})

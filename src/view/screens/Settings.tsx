import React, {useEffect} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useStores} from '../../state'
import {ScreenParams} from '../routes'
import {s} from '../lib/styles'
import {ViewHeader} from '../com/util/ViewHeader'
import {Link} from '../com/util/Link'
import {Text} from '../com/util/text/Text'
import {UserAvatar} from '../com/util/UserAvatar'
import {usePalette} from '../lib/hooks/usePalette'

export const Settings = observer(function Settings({
  navIdx,
  visible,
}: ScreenParams) {
  const pal = usePalette('default')
  const store = useStores()

  useEffect(() => {
    if (!visible) {
      return
    }
    store.shell.setMinimalShellMode(false)
    store.nav.setTitle(navIdx, 'Settings')
  }, [visible, store])

  const onPressSignout = () => {
    store.session.logout()
  }

  return (
    <View style={[s.flex1]}>
      <ViewHeader title="Settings" />
      <View style={[s.mt10, s.pl10, s.pr10, s.flex1]}>
        <View style={[s.flexRow]}>
          <Text style={pal.text}>Signed in as</Text>
          <View style={s.flex1} />
          <TouchableOpacity onPress={onPressSignout}>
            <Text type="xl-heavy" style={pal.link}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>
        <Link
          href={`/profile/${store.me.handle}`}
          title="Your profile"
          noFeedback>
          <View style={[pal.view, styles.profile]}>
            <UserAvatar
              size={40}
              displayName={store.me.displayName}
              handle={store.me.handle || ''}
              avatar={store.me.avatar}
            />
            <View style={[s.ml10]}>
              <Text type="xl-bold" style={pal.text}>
                {store.me.displayName || store.me.handle}
              </Text>
              <Text style={pal.textLight}>@{store.me.handle}</Text>
            </View>
          </View>
        </Link>
        <View style={s.flex1} />
        <Text type="sm-medium" style={[s.mb5]}>
          Advanced
        </Text>
        <Link
          style={[pal.view, s.p10, s.mb2]}
          href="/sys/log"
          title="System log">
          <Text style={pal.link}>System log</Text>
        </Link>
        <Link
          style={[pal.view, s.p10, s.mb2]}
          href="/sys/debug"
          title="Debug tools">
          <Text style={pal.link}>Debug tools</Text>
        </Link>
        <View style={{height: 100}} />
      </View>
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

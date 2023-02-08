import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserAvatar} from './UserAvatar'
import {Text} from './text/Text'
import {useStores} from '../../../state'
import {usePalette} from '../../lib/hooks/usePalette'
import {useAnalytics} from '@segment/analytics-react-native'

const BACK_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

export const ViewHeader = observer(function ViewHeader({
  title,
  canGoBack,
}: {
  title: string
  canGoBack?: boolean
}) {
  const pal = usePalette('default')
  const store = useStores()
  const {track} = useAnalytics()
  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  const onPressMenu = () => {
    track('ViewHeader:MenuButtonClicked')
    store.shell.setMainMenuOpen(true)
  }
  if (typeof canGoBack === 'undefined') {
    canGoBack = store.nav.tab.canGoBack
  }
  return (
    <View style={[styles.header, pal.view]}>
      <TouchableOpacity
        testID="viewHeaderBackOrMenuBtn"
        onPress={canGoBack ? onPressBack : onPressMenu}
        hitSlop={BACK_HITSLOP}
        style={canGoBack ? styles.backBtn : styles.backBtnWide}>
        {canGoBack ? (
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={[styles.backIcon, pal.text]}
          />
        ) : (
          <UserAvatar
            size={30}
            handle={store.me.handle}
            displayName={store.me.displayName}
            avatar={store.me.avatar}
          />
        )}
      </TouchableOpacity>
      <View style={styles.titleContainer} pointerEvents="none">
        <Text type="title" style={[pal.text, styles.title]}>
          {title}
        </Text>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 'auto',
  },
  title: {
    fontWeight: 'bold',
  },

  backBtn: {
    width: 30,
    height: 30,
  },
  backBtnWide: {
    width: 40,
    height: 30,
    marginLeft: 6,
  },
  backIcon: {
    marginTop: 6,
  },
})

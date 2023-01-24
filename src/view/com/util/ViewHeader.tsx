import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserAvatar} from './UserAvatar'
import {Text} from './text/Text'
import {MagnifyingGlassIcon} from '../../lib/icons'
import {useStores} from '../../../state'
import {usePalette} from '../../lib/hooks/usePalette'
import {colors} from '../../lib/styles'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}
const BACK_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

export const ViewHeader = observer(function ViewHeader({
  title,
  subtitle,
  canGoBack,
}: {
  title: string
  subtitle?: string
  canGoBack?: boolean
}) {
  const pal = usePalette('default')
  const store = useStores()
  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  const onPressMenu = () => {
    store.shell.setMainMenuOpen(true)
  }
  const onPressSearch = () => {
    store.nav.navigate('/search')
  }
  const onPressReconnect = () => {
    store.session.connect().catch(e => {
      store.log.warn('Failed to reconnect to server', e)
    })
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
        {subtitle ? (
          <Text
            type="title-sm"
            style={[styles.subtitle, pal.textLight]}
            numberOfLines={1}>
            {subtitle}
          </Text>
        ) : undefined}
      </View>
      <TouchableOpacity
        onPress={onPressSearch}
        hitSlop={HITSLOP}
        style={styles.btn}>
        <MagnifyingGlassIcon size={21} strokeWidth={3} style={pal.text} />
      </TouchableOpacity>
      {!store.session.online ? (
        <TouchableOpacity style={styles.btn} onPress={onPressReconnect}>
          {store.session.attemptingConnect ? (
            <ActivityIndicator />
          ) : (
            <>
              <FontAwesomeIcon icon="signal" style={pal.text} size={16} />
              <FontAwesomeIcon
                icon="x"
                style={[
                  styles.littleXIcon,
                  {backgroundColor: pal.colors.background},
                ]}
                size={8}
              />
            </>
          )}
        </TouchableOpacity>
      ) : undefined}
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
  subtitle: {
    marginLeft: 4,
    maxWidth: 200,
    fontWeight: 'normal',
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
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 20,
    marginLeft: 4,
  },
  littleXIcon: {
    color: colors.red3,
    position: 'absolute',
    right: 7,
    bottom: 7,
  },
})

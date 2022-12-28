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
import {s, colors} from '../../lib/styles'
import {MagnifyingGlassIcon} from '../../lib/icons'
import {useStores} from '../../../state'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}
const BACK_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

export const ViewHeader = observer(function ViewHeader({
  title,
  subtitle,
  canGoBack,
  onPost,
}: {
  title: string
  subtitle?: string
  canGoBack?: boolean
  onPost?: () => void
}) {
  const store = useStores()
  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  const onPressMenu = () => {
    store.shell.setMainMenuOpen(true)
  }
  const onPressCompose = () => {
    store.shell.openComposer({onPost})
  }
  const onPressSearch = () => {
    store.nav.navigate(`/search`)
  }
  const onPressReconnect = () => {
    store.session.connect().catch(e => {
      // log for debugging but ignore otherwise
      console.log(e)
    })
  }
  if (typeof canGoBack === 'undefined') {
    canGoBack = store.nav.tab.canGoBack
  }
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={canGoBack ? onPressBack : onPressMenu}
        hitSlop={BACK_HITSLOP}
        style={canGoBack ? styles.backIcon : styles.backIconWide}>
        {canGoBack ? (
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={{marginTop: 6, color: colors.black}}
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
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : undefined}
      </View>
      <TouchableOpacity
        onPress={onPressCompose}
        hitSlop={HITSLOP}
        style={styles.btn}>
        <FontAwesomeIcon size={18} icon="plus" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onPressSearch}
        hitSlop={HITSLOP}
        style={[styles.btn, {marginLeft: 8}]}>
        <MagnifyingGlassIcon
          size={18}
          strokeWidth={3}
          style={styles.searchBtnIcon}
        />
      </TouchableOpacity>
      {!store.session.online ? (
        <TouchableOpacity
          style={[styles.btn, {marginLeft: 8}, styles.offline]}
          onPress={onPressReconnect}>
          {store.session.attemptingConnect ? (
            <ActivityIndicator />
          ) : (
            <>
              <FontAwesomeIcon icon="signal" style={[s.black]} size={18} />
              <FontAwesomeIcon
                icon="x"
                style={{
                  backgroundColor: colors.white,
                  color: colors.red4,
                  position: 'relative',
                  left: -4,
                  top: 6,
                }}
                size={12}
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
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomColor: colors.gray1,
    borderBottomWidth: 1,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 'auto',
  },
  title: {
    fontSize: 21,
    fontWeight: '600',
    color: colors.black,
  },
  subtitle: {
    fontSize: 18,
    marginLeft: 6,
    color: colors.gray4,
    maxWidth: 200,
  },

  backIcon: {width: 30, height: 30},
  backIconWide: {width: 40, height: 30},
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray1,
    width: 36,
    height: 36,
    borderRadius: 20,
  },
  searchBtnIcon: {
    color: colors.black,
    position: 'relative',
    top: -1,
  },

  offline: {
    backgroundColor: colors.white,
  },
  offlineBtn: {
    backgroundColor: colors.white,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
})

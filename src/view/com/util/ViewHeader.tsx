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
import {useTheme} from '../../lib/ThemeContext'
import {usePalette} from '../../lib/hooks/usePalette'

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
  const theme = useTheme()
  const pal = usePalette('default')
  const store = useStores()
  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  const onPressMenu = () => {
    store.shell.setMainMenuOpen(true)
  }
  const onPressSearch = () => {
    store.nav.navigate(`/search`)
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
        onPress={canGoBack ? onPressBack : onPressMenu}
        hitSlop={BACK_HITSLOP}
        style={canGoBack ? styles.backIcon : styles.backIconWide}>
        {canGoBack ? (
          <FontAwesomeIcon
            size={24}
            icon="angle-left"
            style={[{marginTop: 8}, pal.text]}
          />
        ) : (
          <UserAvatar
            size={40}
            handle={store.me.handle}
            displayName={store.me.displayName}
            avatar={store.me.avatar}
          />
        )}
      </TouchableOpacity>
      <View style={styles.titleContainer} pointerEvents="none">
        <Text type="h3" style={pal.text}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            type="h4"
            style={[styles.subtitle, pal.textLight, {fontWeight: 'normal'}]}
            numberOfLines={1}>
            {subtitle}
          </Text>
        ) : undefined}
      </View>
      <TouchableOpacity
        onPress={onPressSearch}
        hitSlop={HITSLOP}
        style={[styles.btn, {marginLeft: 4}]}>
        <MagnifyingGlassIcon size={26} strokeWidth={3} style={pal.text} />
      </TouchableOpacity>
      {!store.session.online ? (
        <TouchableOpacity
          style={[styles.btn, {marginLeft: 4}]}
          onPress={onPressReconnect}>
          {store.session.attemptingConnect ? (
            <ActivityIndicator />
          ) : (
            <>
              <FontAwesomeIcon icon="signal" style={pal.text} size={23} />
              <FontAwesomeIcon
                icon="x"
                style={{
                  backgroundColor: pal.colors.background,
                  color: theme.palette.error.background,
                  position: 'absolute',
                  right: 0,
                  bottom: 7,
                }}
                size={10}
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
  subtitle: {
    marginLeft: 4,
    maxWidth: 200,
  },

  backIcon: {width: 40, height: 40},
  backIconWide: {width: 50, height: 40},
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 20,
  },
})

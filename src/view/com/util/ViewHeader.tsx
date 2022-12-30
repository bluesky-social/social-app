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
  onPost,
}: {
  title: string
  subtitle?: string
  canGoBack?: boolean
  onPost?: () => void
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
    <View style={[styles.header, pal.view]}>
      <TouchableOpacity
        onPress={canGoBack ? onPressBack : onPressMenu}
        hitSlop={BACK_HITSLOP}
        style={canGoBack ? styles.backIcon : styles.backIconWide}>
        {canGoBack ? (
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={[{marginTop: 6}, pal.text]}
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
        <Text type="h4" style={pal.text}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            type="h5"
            style={[styles.subtitle, pal.textLight, {fontWeight: 'normal'}]}
            numberOfLines={1}>
            {subtitle}
          </Text>
        ) : undefined}
      </View>
      <TouchableOpacity
        onPress={onPressCompose}
        hitSlop={HITSLOP}
        style={[styles.btn, {backgroundColor: pal.colors.backgroundLight}]}>
        <FontAwesomeIcon size={18} icon="plus" style={pal.text} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onPressSearch}
        hitSlop={HITSLOP}
        style={[
          styles.btn,
          {backgroundColor: pal.colors.backgroundLight, marginLeft: 4},
        ]}>
        <MagnifyingGlassIcon size={18} strokeWidth={3} style={pal.text} />
      </TouchableOpacity>
      {!store.session.online ? (
        <TouchableOpacity
          style={[
            styles.btn,
            {backgroundColor: pal.colors.backgroundLight, marginLeft: 4},
          ]}
          onPress={onPressReconnect}>
          {store.session.attemptingConnect ? (
            <ActivityIndicator />
          ) : (
            <>
              <FontAwesomeIcon icon="signal" style={pal.text} size={16} />
              <FontAwesomeIcon
                icon="x"
                style={{
                  backgroundColor: pal.colors.backgroundLight,
                  color: theme.palette.error.background,
                  position: 'absolute',
                  right: 7,
                  bottom: 7,
                }}
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
  subtitle: {
    marginLeft: 4,
    maxWidth: 200,
  },

  backIcon: {width: 30, height: 30},
  backIconWide: {width: 40, height: 30},
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 20,
  },
})

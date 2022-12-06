import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {s, colors} from '../../lib/styles'
import {MagnifyingGlassIcon} from '../../lib/icons'
import {useStores} from '../../../state'

const HITSLOP = {left: 10, top: 10, right: 10, bottom: 10}
const BACK_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

export const ViewHeader = observer(function ViewHeader({
  title,
  subtitle,
  onPost,
}: {
  title: string
  subtitle?: string
  onPost?: () => void
}) {
  const store = useStores()
  const onPressBack = () => {
    store.nav.tab.goBack()
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
  return (
    <>
      <View style={styles.header}>
        {store.nav.tab.canGoBack ? (
          <TouchableOpacity
            onPress={onPressBack}
            hitSlop={BACK_HITSLOP}
            style={styles.backIcon}>
            <FontAwesomeIcon
              size={18}
              icon="angle-left"
              style={{marginTop: 6}}
            />
          </TouchableOpacity>
        ) : undefined}
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
      </View>
      {!store.session.online ? (
        <TouchableOpacity style={styles.offline} onPress={onPressReconnect}>
          {store.session.attemptingConnect ? (
            <>
              <ActivityIndicator />
              <Text style={[s.gray1, s.bold, s.flex1, s.pl5, s.pt5, s.pb5]}>
                Connecting...
              </Text>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon="signal" style={[s.gray2]} size={18} />
              <FontAwesomeIcon
                icon="x"
                style={[
                  s.red4,
                  {
                    backgroundColor: colors.gray6,
                    position: 'relative',
                    left: -4,
                    top: 6,
                  },
                ]}
                border
                size={12}
              />
              <Text style={[s.gray1, s.bold, s.flex1, s.pl2]}>
                Unable to connect
              </Text>
              <View style={styles.offlineBtn}>
                <Text style={styles.offlineBtnText}>Try again</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      ) : undefined}
    </>
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
  },
  subtitle: {
    fontSize: 18,
    marginLeft: 6,
    color: colors.gray4,
    maxWidth: 200,
  },

  backIcon: {width: 30, height: 30},
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray6,
    paddingLeft: 15,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    marginTop: 4,
  },
  offlineBtn: {
    backgroundColor: colors.gray5,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  offlineBtnText: {
    color: colors.white,
    fontWeight: 'bold',
  },
})

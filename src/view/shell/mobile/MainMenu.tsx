import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from '../../../state'
import {s, colors, gradients} from '../../lib/styles'
import {DEF_AVATER} from '../../lib/assets'

export const MainMenu = observer(
  ({active, onClose}: {active: boolean; onClose: () => void}) => {
    const store = useStores()

    // events
    // =

    const onNavigate = (url: string) => {
      store.nav.navigate(url)
      onClose()
    }

    // rendering
    // =

    const FatMenuItem = ({
      icon,
      label,
      url,
      gradient,
    }: {
      icon: IconProp
      label: string
      url: string
      gradient: keyof typeof gradients
    }) => (
      <TouchableOpacity
        style={[styles.fatMenuItem, styles.fatMenuItemMargin]}
        onPress={() => onNavigate(url)}>
        <LinearGradient
          style={[styles.fatMenuItemIconWrapper]}
          colors={[gradients[gradient].start, gradients[gradient].end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <FontAwesomeIcon
            icon={icon}
            style={styles.fatMenuItemIcon}
            size={24}
          />
        </LinearGradient>
        <Text style={styles.fatMenuItemLabel} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    )
    if (!active) {
      return <View />
    }

    return (
      <>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.bg} />
        </TouchableWithoutFeedback>
        <View style={styles.wrapper}>
          <View style={[styles.topSection]}>
            <TouchableOpacity
              style={styles.profile}
              onPress={() => onNavigate(`/profile/${store.me.name || ''}`)}>
              <Image style={styles.profileImage} source={DEF_AVATER} />
              <Text style={styles.profileText} numberOfLines={1}>
                {store.me.displayName || store.me.name || 'My profile'}
              </Text>
            </TouchableOpacity>
            <View style={[s.flex1]} />
            <TouchableOpacity
              style={styles.settings}
              onPress={() => onNavigate(`/settings`)}>
              <FontAwesomeIcon
                icon="gear"
                style={styles.settingsIcon}
                size={24}
              />
            </TouchableOpacity>
          </View>
          <View style={[styles.section]}>
            <View style={styles.fatMenuItems}>
              <FatMenuItem
                icon="house"
                label="Feed"
                url="/"
                gradient="primary"
              />
              <FatMenuItem
                icon="bell"
                label="Notifications"
                url="/notifications"
                gradient="purple"
              />
              <FatMenuItem
                icon="gear"
                label="Settings"
                url="/settings"
                gradient="blue"
              />
            </View>
          </View>
        </View>
      </>
    )
  },
)

const styles = StyleSheet.create({
  bg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#000',
    opacity: 0.2,
  },
  wrapper: {
    position: 'absolute',
    bottom: 75,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    opacity: 1,
    paddingVertical: 10,
  },

  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  section: {
    paddingHorizontal: 10,
  },

  profile: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    borderRadius: 15,
    width: 30,
    height: 30,
    marginRight: 5,
  },
  profileText: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  settings: {},
  settingsIcon: {
    color: colors.gray5,
    marginRight: 10,
  },

  fatMenuItems: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  fatMenuItem: {
    width: 80,
    alignItems: 'center',
    marginRight: 6,
  },
  fatMenuItemMargin: {
    marginRight: 14,
  },
  fatMenuItemIconWrapper: {
    borderRadius: 6,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 2,
  },
  fatMenuItemIcon: {
    color: colors.white,
  },
  fatMenuImage: {
    borderRadius: 30,
    width: 60,
    height: 60,
    marginBottom: 5,
  },
  fatMenuItemLabel: {
    fontSize: 13,
  },
})

import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
  Image,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {HomeIcon} from '../../lib/icons'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'
import {DEF_AVATER} from '../../lib/assets'

export const MainMenu = observer(
  ({active, onClose}: {active: boolean; onClose: () => void}) => {
    const store = useStores()
    const initInterp = useSharedValue<number>(0)

    useEffect(() => {
      if (active) {
        initInterp.value = withTiming(1, {duration: 150})
      } else {
        initInterp.value = 0
      }
    }, [initInterp, active])
    const wrapperAnimStyle = useAnimatedStyle(() => ({
      opacity: interpolate(initInterp.value, [0, 1.0], [0, 1.0]),
    }))
    const menuItemsAnimStyle = useAnimatedStyle(() => ({
      marginTop: interpolate(initInterp.value, [0, 1.0], [15, 0]),
    }))

    // events
    // =

    const onNavigate = (url: string) => {
      store.nav.navigate(url)
      onClose()
    }

    // rendering
    // =

    const MenuItem = ({
      icon,
      label,
      url,
    }: {
      icon: IconProp
      label: string
      url: string
    }) => (
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemMargin]}
        onPress={() => onNavigate(url)}>
        <View style={[styles.menuItemIconWrapper]}>
          {icon === 'home' ? (
            <HomeIcon style={styles.menuItemIcon} size={24} />
          ) : (
            <FontAwesomeIcon
              icon={icon}
              style={styles.menuItemIcon}
              size={24}
            />
          )}
        </View>
        <Text style={styles.menuItemLabel} numberOfLines={1}>
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
        <Animated.View style={[styles.wrapper, wrapperAnimStyle]}>
          <SafeAreaView>
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
              <Animated.View style={[styles.menuItems, menuItemsAnimStyle]}>
                <MenuItem icon="home" label="Home" url="/" />
                <MenuItem
                  icon={['far', 'circle-user']}
                  label="Contacts"
                  url="/contacts"
                />
                <MenuItem
                  icon={['far', 'bell']}
                  label="Notifications"
                  url="/notifications"
                />
              </Animated.View>
            </View>
          </SafeAreaView>
        </Animated.View>
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
    // backgroundColor: '#000',
    opacity: 0,
  },
  wrapper: {
    position: 'absolute',
    top: 0,
    bottom: 75,
    width: '100%',
    backgroundColor: '#fff',
  },

  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
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
    marginRight: 8,
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

  menuItems: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  menuItem: {
    width: 80,
    alignItems: 'center',
    marginRight: 6,
  },
  menuItemMargin: {
    marginRight: 14,
  },
  menuItemIconWrapper: {
    borderRadius: 6,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: colors.gray1,
  },
  menuItemIcon: {
    color: colors.gray5,
  },
  menuItemLabel: {
    fontSize: 13,
  },
})

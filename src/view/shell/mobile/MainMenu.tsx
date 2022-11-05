import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {
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
import {HomeIcon, UserGroupIcon, BellIcon} from '../../lib/icons'
import {UserAvatar} from '../../com/util/UserAvatar'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'

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
      top: interpolate(initInterp.value, [0, 1.0], [15, 0]),
    }))

    // events
    // =

    const onNavigate = (url: string) => {
      store.nav.navigate(url)
      onClose()
    }

    // rendering
    // =

    const MenuItemBlank = () => (
      <View style={[styles.menuItem, styles.menuItemMargin]} />
    )

    const MenuItem = ({
      icon,
      label,
      url,
      count,
    }: {
      icon: IconProp
      label: string
      url: string
      count?: number
    }) => (
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemMargin]}
        onPress={() => onNavigate(url)}>
        <View style={[styles.menuItemIconWrapper]}>
          {icon === 'home' ? (
            <HomeIcon style={styles.menuItemIcon} size="32" />
          ) : icon === 'user-group' ? (
            <UserGroupIcon style={styles.menuItemIcon} size="36" />
          ) : icon === 'bell' ? (
            <BellIcon style={styles.menuItemIcon} size="32" />
          ) : (
            <FontAwesomeIcon
              icon={icon}
              style={styles.menuItemIcon}
              size={28}
            />
          )}
        </View>
        {count ? (
          <View style={styles.menuItemCount}>
            <Text style={styles.menuItemCountLabel}>{count}</Text>
          </View>
        ) : undefined}
        <Text style={styles.menuItemLabel} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    )
    const MenuItemActor = ({
      label,
      url,
      count,
    }: {
      label: string
      url: string
      count?: number
    }) => (
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemMargin]}
        onPress={() => onNavigate(url)}>
        <View style={s.mb5}>
          <UserAvatar size={60} displayName={label} handle={label} />
        </View>
        {count ? (
          <View style={styles.menuItemCount}>
            <Text style={styles.menuItemCountLabel}>{count}</Text>
          </View>
        ) : undefined}
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
                onPress={() => onNavigate(`/profile/${store.me.handle || ''}`)}>
                <View style={styles.profileImage}>
                  <UserAvatar
                    size={35}
                    displayName={store.me.displayName}
                    handle={store.me.handle || ''}
                  />
                </View>
                <Text style={styles.profileText} numberOfLines={1}>
                  {store.me.displayName || store.me.handle || 'My profile'}
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
            <Animated.View
              style={[
                styles.section,
                styles.menuItemsAnimContainer,
                menuItemsAnimStyle,
              ]}>
              <View style={[styles.menuItems]}>
                <MenuItem icon="home" label="Home" url="/" />
                <MenuItem
                  icon="bell"
                  label="Notifications"
                  url="/notifications"
                  count={store.me.notificationCount}
                />
                <MenuItemBlank />
                <MenuItemBlank />
              </View>

              <Text style={styles.heading}>Scenes</Text>
              <View style={[styles.menuItems]}>
                <MenuItem icon={['far', 'compass']} label="Discover" url="/" />
                <MenuItem
                  icon={'user-group'}
                  label="Create Scene"
                  url="/contacts"
                />
                <MenuItemActor label="Galaxy Brain" url="/" />
                <MenuItemActor label="Paul's Friends" url="/" />
              </View>
              <View style={[styles.menuItems]}>
                <MenuItemActor label="Cool People Only" url="/" />
                <MenuItemActor label="Techsky" url="/" />
                <MenuItemBlank />
                <MenuItemBlank />
              </View>
            </Animated.View>
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
    height: 40,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: 21,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
  },

  profile: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    marginRight: 8,
  },
  profileText: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  settings: {},
  settingsIcon: {
    color: colors.gray5,
    marginRight: 10,
  },

  menuItemsAnimContainer: {
    position: 'relative',
  },
  menuItems: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
  },
  menuItemMargin: {
    marginRight: 10,
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
    textAlign: 'center',
  },
  menuItemCount: {
    position: 'absolute',
    left: 48,
    top: 10,
    backgroundColor: colors.red3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    borderRadius: 6,
  },
  menuItemCountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
})

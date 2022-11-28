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
import _chunk from 'lodash.chunk'
import {HomeIcon, UserGroupIcon, BellIcon} from '../../lib/icons'
import {UserAvatar} from '../../com/util/UserAvatar'
import {useStores} from '../../../state'
import {CreateSceneModel} from '../../../state/models/shell-ui'
import {s, colors} from '../../lib/styles'

export const MainMenu = observer(
  ({
    active,
    insetBottom,
    onClose,
  }: {
    active: boolean
    insetBottom: number
    onClose: () => void
  }) => {
    const store = useStores()
    const initInterp = useSharedValue<number>(0)

    useEffect(() => {
      if (active) {
        // trigger a refresh in case memberships have changed recently
        store.me.refreshMemberships()
      }
    }, [active])
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
    const onPressCreateScene = () => {
      store.shell.openModal(new CreateSceneModel())
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
      count,
      url,
      onPress,
    }: {
      icon: IconProp
      label: string
      count?: number
      url?: string
      onPress?: () => void
    }) => (
      <TouchableOpacity
        style={[styles.menuItem, styles.menuItemMargin]}
        onPress={onPress ? onPress : () => onNavigate(url || '/')}>
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

    const MenuItems = ({
      children,
    }: {
      children: (JSX.Element | JSX.Element[])[]
    }) => {
      const groups = _chunk(children.flat(), 4)
      const lastGroup = groups.at(-1)
      while (lastGroup && lastGroup.length < 4) {
        lastGroup.push(<MenuItemBlank />)
      }
      return (
        <>
          {groups.map((group, i) => (
            <View key={i} style={[styles.menuItems]}>
              {group.map((el, j) => (
                <React.Fragment key={j}>{el}</React.Fragment>
              ))}
            </View>
          ))}
        </>
      )
    }

    /*TODO <MenuItem icon={['far', 'compass']} label="Discover" url="/" />*/
    return (
      <>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.bg} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.wrapper,
            {bottom: insetBottom + 45},
            wrapperAnimStyle,
          ]}>
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
              <MenuItems>
                <MenuItem icon="home" label="Home" url="/" />
                <MenuItem
                  icon="bell"
                  label="Notifications"
                  url="/notifications"
                  count={store.me.notificationCount}
                />
              </MenuItems>

              <Text style={styles.heading}>Scenes</Text>
              <MenuItems>
                <MenuItem
                  icon={'user-group'}
                  label="Create Scene"
                  onPress={onPressCreateScene}
                />
                {store.me.memberships ? (
                  store.me.memberships.memberships.map((membership, i) => (
                    <MenuItemActor
                      key={i}
                      label={membership.displayName || membership.handle}
                      url={`/profile/${membership.handle}`}
                    />
                  ))
                ) : (
                  <MenuItemBlank />
                )}
              </MenuItems>
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
    width: '100%',
    backgroundColor: '#fff',
  },

  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 10,
    marginTop: 12,
    marginBottom: 20,
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

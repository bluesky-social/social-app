import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {PressableWithHover} from 'view/com/util/PressableWithHover'
import {
  useLinkProps,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Link} from 'view/com/util/Link'
import {LoadingPlaceholder} from 'view/com/util/LoadingPlaceholder'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s, colors} from 'lib/styles'
import {
  HomeIcon,
  HomeIconSolid,
  MagnifyingGlassIcon2,
  MagnifyingGlassIcon2Solid,
  BellIcon,
  BellIconSolid,
  UserIcon,
  UserIconSolid,
  CogIcon,
  CogIconSolid,
  ComposeIcon2,
  HandIcon,
  SatelliteDishIcon,
  SatelliteDishIconSolid,
} from 'lib/icons'
import {getCurrentRoute, isTab, isStateAtTabRoot} from 'lib/routes/helpers'
import {NavigationProp, CommonNavigatorParams} from 'lib/routes/types'
import {router} from '../../../routes'
import {makeProfileLink} from 'lib/routes/links'

const ProfileCard = observer(() => {
  const store = useStores()
  const {isDesktop} = useWebMediaQueries()
  const size = isDesktop ? 64 : 48
  return store.me.handle ? (
    <Link
      href={makeProfileLink(store.me)}
      style={[styles.profileCard, !isDesktop && styles.profileCardTablet]}
      asAnchor>
      <UserAvatar avatar={store.me.avatar} size={size} />
    </Link>
  ) : (
    <View style={[styles.profileCard, !isDesktop && styles.profileCardTablet]}>
      <LoadingPlaceholder
        width={size}
        height={size}
        style={{borderRadius: size}}
      />
    </View>
  )
})

function BackBtn() {
  const {isTablet} = useWebMediaQueries()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()
  const shouldShow = useNavigationState(state => !isStateAtTabRoot(state))

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  if (!shouldShow || isTablet) {
    return <></>
  }
  return (
    <TouchableOpacity
      testID="viewHeaderBackOrMenuBtn"
      onPress={onPressBack}
      style={styles.backBtn}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="">
      <FontAwesomeIcon
        size={24}
        icon="angle-left"
        style={pal.text as FontAwesomeIconStyle}
      />
    </TouchableOpacity>
  )
}

interface NavItemProps {
  count?: string
  href: string
  icon: JSX.Element
  iconFilled: JSX.Element
  label: string
}
const NavItem = observer(
  ({count, href, icon, iconFilled, label}: NavItemProps) => {
    const pal = usePalette('default')
    const store = useStores()
    const {isDesktop, isTablet} = useWebMediaQueries()
    const [pathName] = React.useMemo(() => router.matchPath(href), [href])
    const currentRouteInfo = useNavigationState(state => {
      if (!state) {
        return {name: 'Home'}
      }
      return getCurrentRoute(state)
    })
    let isCurrent =
      currentRouteInfo.name === 'Profile'
        ? isTab(currentRouteInfo.name, pathName) &&
          (currentRouteInfo.params as CommonNavigatorParams['Profile']).name ===
            store.me.handle
        : isTab(currentRouteInfo.name, pathName)
    const {onPress} = useLinkProps({to: href})
    const onPressWrapped = React.useCallback(
      (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (e.ctrlKey || e.metaKey || e.altKey) {
          return
        }
        e.preventDefault()
        if (isCurrent) {
          store.emitScreenSoftReset()
        } else {
          onPress()
        }
      },
      [onPress, isCurrent, store],
    )

    return (
      <PressableWithHover
        style={styles.navItemWrapper}
        hoverStyle={pal.viewLight}
        // @ts-ignore the function signature differs on web -prf
        onPress={onPressWrapped}
        // @ts-ignore web only -prf
        href={href}
        dataSet={{noUnderline: 1}}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityHint="">
        <View
          style={[
            styles.navItemIconWrapper,
            isTablet && styles.navItemIconWrapperTablet,
          ]}>
          {isCurrent ? iconFilled : icon}
          {typeof count === 'string' && count ? (
            <Text
              type="button"
              style={[
                styles.navItemCount,
                isTablet && styles.navItemCountTablet,
              ]}>
              {count}
            </Text>
          ) : null}
        </View>
        {isDesktop && (
          <Text type="title" style={[isCurrent ? s.bold : s.normal, pal.text]}>
            {label}
          </Text>
        )}
      </PressableWithHover>
    )
  },
)

function ComposeBtn() {
  const store = useStores()
  const {getState} = useNavigation()
  const {isTablet} = useWebMediaQueries()

  const getProfileHandle = () => {
    const {routes} = getState()
    const currentRoute = routes[routes.length - 1]
    if (currentRoute.name === 'Profile') {
      const {name: handle} =
        currentRoute.params as CommonNavigatorParams['Profile']
      if (handle === store.me.handle) return undefined
      return handle
    }
    return undefined
  }

  const onPressCompose = () =>
    store.shell.openComposer({mention: getProfileHandle()})

  if (isTablet) {
    return null
  }
  return (
    <TouchableOpacity
      style={[styles.newPostBtn]}
      onPress={onPressCompose}
      accessibilityRole="button"
      accessibilityLabel="New post"
      accessibilityHint="">
      <View style={styles.newPostBtnIconWrapper}>
        <ComposeIcon2
          size={19}
          strokeWidth={2}
          style={styles.newPostBtnLabel}
        />
      </View>
      <Text type="button" style={styles.newPostBtnLabel}>
        New Post
      </Text>
    </TouchableOpacity>
  )
}

export const DesktopLeftNav = observer(function DesktopLeftNav() {
  const store = useStores()
  const pal = usePalette('default')
  const {isDesktop, isTablet} = useWebMediaQueries()

  return (
    <View
      style={[
        styles.leftNav,
        isTablet && styles.leftNavTablet,
        pal.view,
        pal.border,
      ]}>
      {store.session.hasSession && <ProfileCard />}
      <BackBtn />
      <NavItem
        href="/"
        icon={<HomeIcon size={isDesktop ? 24 : 28} style={pal.text} />}
        iconFilled={
          <HomeIconSolid
            strokeWidth={4}
            size={isDesktop ? 24 : 28}
            style={pal.text}
          />
        }
        label="Home"
      />
      <NavItem
        href="/search"
        icon={
          <MagnifyingGlassIcon2
            strokeWidth={2}
            size={isDesktop ? 24 : 26}
            style={pal.text}
          />
        }
        iconFilled={
          <MagnifyingGlassIcon2Solid
            strokeWidth={2}
            size={isDesktop ? 24 : 26}
            style={pal.text}
          />
        }
        label="Search"
      />
      <NavItem
        href="/feeds"
        icon={
          <SatelliteDishIcon
            strokeWidth={1.75}
            style={pal.text as FontAwesomeIconStyle}
            size={isDesktop ? 24 : 28}
          />
        }
        iconFilled={
          <SatelliteDishIconSolid
            strokeWidth={1.75}
            style={pal.text as FontAwesomeIconStyle}
            size={isDesktop ? 24 : 28}
          />
        }
        label="My Feeds"
      />
      <NavItem
        href="/notifications"
        count={store.me.notifications.unreadCountLabel}
        icon={
          <BellIcon
            strokeWidth={2}
            size={isDesktop ? 24 : 26}
            style={pal.text}
          />
        }
        iconFilled={
          <BellIconSolid
            strokeWidth={1.5}
            size={isDesktop ? 24 : 26}
            style={pal.text}
          />
        }
        label="Notifications"
      />
      <NavItem
        href="/moderation"
        icon={
          <HandIcon
            strokeWidth={5.5}
            style={pal.text as FontAwesomeIconStyle}
            size={isDesktop ? 24 : 27}
          />
        }
        iconFilled={
          <FontAwesomeIcon
            icon="hand"
            style={pal.text as FontAwesomeIconStyle}
            size={isDesktop ? 20 : 26}
          />
        }
        label="Moderation"
      />
      {store.session.hasSession && (
        <NavItem
          href={makeProfileLink(store.me)}
          icon={
            <UserIcon
              strokeWidth={1.75}
              size={isDesktop ? 28 : 30}
              style={pal.text}
            />
          }
          iconFilled={
            <UserIconSolid
              strokeWidth={1.75}
              size={isDesktop ? 28 : 30}
              style={pal.text}
            />
          }
          label="Profile"
        />
      )}
      <NavItem
        href="/settings"
        icon={
          <CogIcon
            strokeWidth={1.75}
            size={isDesktop ? 28 : 32}
            style={pal.text}
          />
        }
        iconFilled={
          <CogIconSolid
            strokeWidth={1.5}
            size={isDesktop ? 28 : 32}
            style={pal.text}
          />
        }
        label="Settings"
      />
      {store.session.hasSession && <ComposeBtn />}
    </View>
  )
})

const styles = StyleSheet.create({
  leftNav: {
    position: 'absolute',
    top: 10,
    // @ts-ignore web only
    right: 'calc(50vw + 312px)',
    width: 220,
    // @ts-ignore web only
    maxHeight: 'calc(100vh - 10px)',
    overflowY: 'auto',
  },
  leftNavTablet: {
    top: 0,
    left: 0,
    right: 'auto',
    borderRightWidth: 1,
    height: '100%',
    width: 76,
    alignItems: 'center',
  },

  profileCard: {
    marginVertical: 10,
    width: 90,
    paddingLeft: 12,
  },
  profileCardTablet: {
    width: 70,
  },

  backBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
  },

  navItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  navItemIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    marginTop: 2,
    zIndex: 1,
  },
  navItemIconWrapperTablet: {
    width: 40,
    height: 40,
  },
  navItemCount: {
    position: 'absolute',
    top: 0,
    left: 15,
    backgroundColor: colors.blue3,
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  navItemCountTablet: {
    left: 18,
    fontSize: 14,
  },

  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.blue3,
    marginLeft: 12,
    marginTop: 20,
    marginBottom: 10,
    gap: 8,
  },
  newPostBtnIconWrapper: {},
  newPostBtnLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
})

import {
  BellIcon,
  BellIconSolid,
  ComposeIcon2,
  HomeIcon,
  HomeIconSolid,
  UserIcon,
  UserIconSolid,
} from 'lib/icons'
import {CommonNavigatorParams, NavigationProp} from 'lib/routes/types'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {colors, s} from 'lib/styles'
import {getCurrentRoute, isStateAtTabRoot, isTab} from 'lib/routes/helpers'
import {
  useLinkProps,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native'

import {Banner} from '../Banner'
import {Link} from 'view/com/util/Link'
import {PressableWithHover} from 'view/com/util/PressableWithHover'
import React from 'react'
import {Text} from 'view/com/util/text/Text'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {observer} from 'mobx-react-lite'
import {router} from '../../../routes'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'

const ProfileCard = observer(() => {
  const store = useStores()
  console.log(store.agent)
  return (
    <Link
      href={`/profile/${store.me.handle}`}
      style={styles.profileCard}
      asAnchor>
      <UserAvatar avatar={store.me.avatar} size={64} />
    </Link>
  )
})

function BackBtn() {
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

  if (!shouldShow) {
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
export const NavItem = observer(
  ({count, href, icon, iconFilled, label}: NavItemProps) => {
    const pal = usePalette('default')
    const store = useStores()
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
        <View style={[styles.navItemIconWrapper]}>
          {isCurrent ? iconFilled : icon}
          {typeof count === 'string' && count ? (
            <Text type="button" style={styles.navItemCount}>
              {count}
            </Text>
          ) : null}
        </View>
        <Text type="title" style={[isCurrent ? s.bold : s.normal, pal.text]}>
          {label}
        </Text>
      </PressableWithHover>
    )
  },
)

type SignOutProps = {
  onPressHandler: () => void
}

export function SignOutBtn({onPressHandler}: SignOutProps) {
  const pal = usePalette('default')
  return (
    <PressableWithHover
      style={styles.navItemWrapper}
      // @ts-ignore the function signature differs on web -prf
      onPress={onPressHandler}
      // @ts-ignore web only -prf
      dataSet={{noUnderline: 1}}
      accessibilityRole="tab"
      accessibilityLabel={'Sign Out'}
      accessibilityHint="">
      <View style={[styles.navItemIconWrapper]}>
        <FontAwesomeIcon
          size={24}
          icon="sign-out"
          style={{...pal.text, marginLeft: 4} as FontAwesomeIconStyle}
        />
      </View>
      <Text type="title" style={[s.normal, pal.text]}>
        Sign Out
      </Text>
    </PressableWithHover>
  )
}

function ComposeBtn() {
  const store = useStores()
  const onPressCompose = () => store.shell.openComposer({})

  return (
    <TouchableOpacity
      style={[styles.newPostBtn]}
      onPress={onPressCompose}
      accessibilityRole="button"
      accessibilityLabel="Compose post"
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
  const {track} = useAnalytics()

  const onPressSignout = React.useCallback(() => {
    track('Settings:SignOutButtonClicked')
    store.session.logout()
  }, [track, store])

  return (
    <View style={[styles.leftNav, pal.view]}>
      <Banner />

      {store.session.hasSession && <ProfileCard />}
      <BackBtn />
      <NavItem
        href="/"
        icon={<HomeIcon size={24} style={pal.text} />}
        iconFilled={
          <HomeIconSolid strokeWidth={4} size={24} style={pal.text} />
        }
        label="Home"
      />
      {store.session.hasSession && (
        <>
          <NavItem
            href="/notifications"
            count={store.me.notifications.unreadCountLabel}
            icon={<BellIcon strokeWidth={2} size={24} style={pal.text} />}
            iconFilled={
              <BellIconSolid strokeWidth={1.5} size={24} style={pal.text} />
            }
            label="Notifications"
          />
          {/* <NavItem
            count={store.me.notifications.unreadCountLabel}
            icon={<BellIcon strokeWidth={2} size={24} style={pal.text} />}
            iconFilled={
              <BellIconSolid strokeWidth={1.5} size={24} style={pal.text} />
            }
            label="Sign Out"
          /> */}
          <SignOutBtn onPressHandler={() => onPressSignout()} />
          <ComposeBtn />
        </>
      )}
      {!store.session.hasSession && (
        <NavItem
          href="/signin"
          count={store.me.notifications.unreadCountLabel}
          label="Sign in"
          icon={<UserIcon />}
          iconFilled={<UserIconSolid />}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  leftNav: {
    position: 'absolute',
    top: 10,
    right: 'calc(50vw + 312px)',
    width: 220,
    maxHeight: 'calc(100vh - 10px)',
    overflowY: 'auto',
  },

  profileCard: {
    marginVertical: 10,
    width: 90,
    paddingLeft: 12,
  },

  backBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    marginTop: 100,
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

  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.splx.primary[50],
    marginLeft: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  newPostBtnIconWrapper: {
    marginRight: 8,
  },
  newPostBtnLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  btn: {
    borderRadius: 32,
    paddingVertical: 16,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  btnLabel: {
    textAlign: 'center',
    fontSize: 21,
  },
})

import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  useLinkProps,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {getCurrentRoute, isStateAtTabRoot, isTab} from '#/lib/routes/helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {isInvalidHandle} from '#/lib/strings/handles'
import {emitSoftReset} from '#/state/events'
import {useFetchHandle} from '#/state/queries/handle'
import {useUnreadMessageCount} from '#/state/queries/messages/list-converations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {Link} from '#/view/com/util/Link'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {NavSignupCard} from '#/view/shell/NavSignupCard'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {
  BulletList_Filled_Corner0_Rounded as ListFilled,
  BulletList_Stroke2_Corner0_Rounded as List,
} from '#/components/icons/BulletList'
import {EditBig_Stroke2_Corner0_Rounded as EditBig} from '#/components/icons/EditBig'
import {
  Hashtag_Filled_Corner0_Rounded as HashtagFilled,
  Hashtag_Stroke2_Corner0_Rounded as Hashtag,
} from '#/components/icons/Hashtag'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled} from '#/components/icons/MagnifyingGlass'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as MagnifyingGlass} from '#/components/icons/MagnifyingGlass2'
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import {
  SettingsGear2_Filled_Corner0_Rounded as SettingsFilled,
  SettingsGear2_Stroke2_Corner0_Rounded as Settings,
} from '#/components/icons/SettingsGear2'
import {
  UserCircle_Filled_Corner0_Rounded as UserCircleFilled,
  UserCircle_Stroke2_Corner0_Rounded as UserCircle,
} from '#/components/icons/UserCircle'
import {Text} from '#/components/Typography'
import {router} from '../../../routes'

const NAV_ICON_WIDTH = 28

function ProfileCard() {
  const {currentAccount} = useSession()
  const {isLoading, data: profile} = useProfileQuery({did: currentAccount!.did})
  const {isDesktop} = useWebMediaQueries()
  const {_} = useLingui()
  const size = 48

  return !isLoading && profile ? (
    <Link
      href={makeProfileLink({
        did: currentAccount!.did,
        handle: currentAccount!.handle,
      })}
      style={[styles.profileCard, !isDesktop && styles.profileCardTablet]}
      title={_(msg`My Profile`)}
      asAnchor>
      <UserAvatar
        avatar={profile.avatar}
        size={size}
        type={profile?.associated?.labeler ? 'labeler' : 'user'}
      />
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
}

const HIDDEN_BACK_BNT_ROUTES = ['StarterPackWizard', 'StarterPackEdit']

function BackBtn() {
  const {isTablet} = useWebMediaQueries()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const shouldShow = useNavigationState(
    state =>
      !isStateAtTabRoot(state) &&
      !HIDDEN_BACK_BNT_ROUTES.includes(getCurrentRoute(state).name),
  )

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
      accessibilityLabel={_(msg`Go back`)}
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
function NavItem({count, href, icon, iconFilled, label}: NavItemProps) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {gtMobile, gtTablet} = useBreakpoints()
  const isTablet = gtMobile && !gtTablet
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
          currentAccount?.handle
      : isTab(currentRouteInfo.name, pathName)
  const {onPress} = useLinkProps({to: href})
  const onPressWrapped = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }
      e.preventDefault()
      if (isCurrent) {
        emitSoftReset()
      } else {
        onPress()
      }
    },
    [onPress, isCurrent],
  )

  return (
    <PressableWithHover
      style={[
        a.flex_row,
        a.align_center,
        a.p_md,
        a.rounded_sm,
        a.gap_sm,
        a.outline_inset_1,
      ]}
      hoverStyle={t.atoms.bg_contrast_25}
      // @ts-ignore the function signature differs on web -prf
      onPress={onPressWrapped}
      // @ts-ignore web only -prf
      href={href}
      dataSet={{noUnderline: 1}}
      role="link"
      accessibilityLabel={label}
      accessibilityHint="">
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.z_10,
          {
            width: 24,
            height: 24,
          },
          isTablet && {
            width: 40,
            height: 40,
          },
        ]}>
        {isCurrent ? iconFilled : icon}
        {typeof count === 'string' && count ? (
          <Text
            accessibilityLabel={_(msg`${count} unread items`)}
            accessibilityHint=""
            accessible={true}
            style={[
              a.absolute,
              a.text_xs,
              a.font_bold,
              a.rounded_full,
              a.text_center,
              {
                top: '-10%',
                left: count.length === 1 ? '50%' : '40%',
                backgroundColor: t.palette.primary_500,
                color: t.palette.white,
                lineHeight: a.text_sm.fontSize,
                paddingHorizontal: 4,
                paddingVertical: 1,
                minWidth: 16,
              },
              isTablet && [
                {
                  top: '10%',
                  left: count.length === 1 ? '50%' : '40%',
                },
              ],
            ]}>
            {count}
          </Text>
        ) : null}
      </View>
      {gtTablet && (
        <Text style={[a.text_xl, isCurrent ? a.font_heavy : a.font_normal]}>
          {label}
        </Text>
      )}
    </PressableWithHover>
  )
}

function ComposeBtn() {
  const {currentAccount} = useSession()
  const {getState} = useNavigation()
  const {openComposer} = useComposerControls()
  const {_} = useLingui()
  const {isTablet} = useWebMediaQueries()
  const [isFetchingHandle, setIsFetchingHandle] = React.useState(false)
  const fetchHandle = useFetchHandle()

  const getProfileHandle = async () => {
    const routes = getState()?.routes
    const currentRoute = routes?.[routes?.length - 1]

    if (currentRoute?.name === 'Profile') {
      let handle: string | undefined = (
        currentRoute.params as CommonNavigatorParams['Profile']
      ).name

      if (handle.startsWith('did:')) {
        try {
          setIsFetchingHandle(true)
          handle = await fetchHandle(handle)
        } catch (e) {
          handle = undefined
        } finally {
          setIsFetchingHandle(false)
        }
      }

      if (
        !handle ||
        handle === currentAccount?.handle ||
        isInvalidHandle(handle)
      )
        return undefined

      return handle
    }

    return undefined
  }

  const onPressCompose = async () =>
    openComposer({mention: await getProfileHandle()})

  if (isTablet) {
    return null
  }
  return (
    <View style={[a.flex_row, a.pl_md, a.pt_xl]}>
      <Button
        disabled={isFetchingHandle}
        label={_(msg`Compose new post`)}
        onPress={onPressCompose}
        size="large"
        variant="solid"
        color="primary"
        style={[a.rounded_full]}>
        <ButtonIcon icon={EditBig} position="left" />
        <ButtonText>
          <Trans context="action">New Post</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

function ChatNavItem() {
  const pal = usePalette('default')
  const {_} = useLingui()
  const numUnreadMessages = useUnreadMessageCount()

  return (
    <NavItem
      href="/messages"
      count={numUnreadMessages.numUnread}
      icon={
        <Message style={pal.text} aria-hidden={true} width={NAV_ICON_WIDTH} />
      }
      iconFilled={
        <MessageFilled
          style={pal.text}
          aria-hidden={true}
          width={NAV_ICON_WIDTH}
        />
      }
      label={_(msg`Chat`)}
    />
  )
}

export function DesktopLeftNav() {
  const {hasSession, currentAccount} = useSession()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isDesktop, isTablet} = useWebMediaQueries()
  const numUnreadNotifications = useUnreadNotifications()

  if (!hasSession && !isDesktop) {
    return null
  }

  return (
    <View
      role="navigation"
      style={[
        styles.leftNav,
        isTablet && styles.leftNavTablet,
        pal.view,
        pal.border,
      ]}>
      {hasSession ? (
        <ProfileCard />
      ) : isDesktop ? (
        <View style={[a.pt_xl]}>
          <NavSignupCard />
        </View>
      ) : null}

      {hasSession && (
        <>
          <BackBtn />

          <NavItem
            href="/"
            icon={
              <Home
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
                style={pal.text}
              />
            }
            iconFilled={
              <HomeFilled
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
                style={pal.text}
              />
            }
            label={_(msg`Home`)}
          />
          <NavItem
            href="/search"
            icon={
              <MagnifyingGlass
                style={pal.text}
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
              />
            }
            iconFilled={
              <MagnifyingGlassFilled
                style={pal.text}
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
              />
            }
            label={_(msg`Search`)}
          />
          <NavItem
            href="/notifications"
            count={numUnreadNotifications}
            icon={
              <Bell
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
                style={pal.text}
              />
            }
            iconFilled={
              <BellFilled
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
                style={pal.text}
              />
            }
            label={_(msg`Notifications`)}
          />
          <ChatNavItem />
          <NavItem
            href="/feeds"
            icon={
              <Hashtag
                style={pal.text as FontAwesomeIconStyle}
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
              />
            }
            iconFilled={
              <HashtagFilled
                style={pal.text as FontAwesomeIconStyle}
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
              />
            }
            label={_(msg`Feeds`)}
          />
          <NavItem
            href="/lists"
            icon={
              <List
                style={pal.text}
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
              />
            }
            iconFilled={
              <ListFilled
                style={pal.text}
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
              />
            }
            label={_(msg`Lists`)}
          />
          <NavItem
            href={currentAccount ? makeProfileLink(currentAccount) : '/'}
            icon={
              <UserCircle
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
                style={pal.text}
              />
            }
            iconFilled={
              <UserCircleFilled
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
                style={pal.text}
              />
            }
            label={_(msg`Profile`)}
          />
          <NavItem
            href="/settings"
            icon={
              <Settings
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
                style={pal.text}
              />
            }
            iconFilled={
              <SettingsFilled
                aria-hidden={true}
                width={NAV_ICON_WIDTH}
                style={pal.text}
              />
            }
            label={_(msg`Settings`)}
          />

          <ComposeBtn />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  leftNav: {
    // @ts-ignore web only
    position: 'fixed',
    top: 10,
    // @ts-ignore web only
    left: 'calc(50vw - 300px - 220px - 20px)',
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
})

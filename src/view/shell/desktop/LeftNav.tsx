import React from 'react'
import {StyleSheet, View} from 'react-native'
import {FontAwesomeIconStyle} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  useLinkProps,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {getCurrentRoute, isTab} from '#/lib/routes/helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {emitSoftReset} from '#/state/events'
import {useHomeBadge} from '#/state/home-badge'
import {useFetchHandle} from '#/state/queries/handle'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfilesQuery} from '#/state/queries/profile'
import {useSession, useSessionApi} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
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
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {router} from '../../../routes'

const NAV_ICON_WIDTH = 28

function ProfileCard() {
  const {currentAccount, accounts} = useSession()
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  const {logoutEveryAccount} = useSessionApi()
  const {isLoading, data} = useProfilesQuery({
    handles: accounts.map(a => a.did),
  })
  const profiles = data?.profiles
  const signOutPromptControl = Prompt.usePromptControl()
  const {gtTablet} = useBreakpoints()
  const {_} = useLingui()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const closeEverything = useCloseAllActiveElements()

  const size = 48

  const onAddAnotherAccount = () => {
    setShowLoggedOut(true)
    closeEverything()
  }

  const profile = profiles?.find(p => p.did === currentAccount!.did)
  const otherAccounts = accounts
    .filter(acc => acc.did !== currentAccount!.did)
    .map(account => ({
      account,
      profile: profiles?.find(p => p.did === account.did),
    }))

  return (
    <View style={[a.my_md, gtTablet && [a.align_start, a.pl_md]]}>
      {!isLoading && profile ? (
        <Menu.Root>
          <Menu.Trigger label={_(msg`Switch accounts`)}>
            {({props}) => (
              <Button label={props.accessibilityLabel} {...props}>
                <UserAvatar
                  avatar={profile.avatar}
                  size={size}
                  type={profile?.associated?.labeler ? 'labeler' : 'user'}
                />
              </Button>
            )}
          </Menu.Trigger>
          <Menu.Outer>
            {otherAccounts && otherAccounts.length > 0 && (
              <>
                <Menu.Group>
                  <Menu.LabelText>
                    <Trans>Switch account</Trans>
                  </Menu.LabelText>
                  {otherAccounts?.map(other => (
                    <Menu.Item
                      disabled={!!pendingDid}
                      style={[a.gap_sm, {minWidth: 150}]}
                      key={other.account.did}
                      label={_(
                        msg`Switch to ${sanitizeHandle(
                          other.profile?.handle ?? other.account.handle,
                          '@',
                        )}`,
                      )}
                      onPress={() =>
                        onPressSwitchAccount(other.account, 'SwitchAccount')
                      }>
                      <UserAvatar avatar={other.profile?.avatar} size={20} />
                      <Menu.ItemText>
                        {sanitizeHandle(
                          other.profile?.handle ?? other.account.handle,
                          '@',
                        )}
                      </Menu.ItemText>
                    </Menu.Item>
                  ))}
                </Menu.Group>
                <Menu.Divider />
              </>
            )}
            <Menu.Item
              label={_(msg`Add another account`)}
              onPress={onAddAnotherAccount}>
              <Menu.ItemText>
                <Trans>Add another account</Trans>
              </Menu.ItemText>
            </Menu.Item>
            <Menu.Item
              label={_(msg`Sign out`)}
              onPress={signOutPromptControl.open}>
              <Menu.ItemText>
                <Trans>Sign out</Trans>
              </Menu.ItemText>
            </Menu.Item>
          </Menu.Outer>
        </Menu.Root>
      ) : (
        <LoadingPlaceholder
          width={size}
          height={size}
          style={{borderRadius: size}}
        />
      )}
      <Prompt.Basic
        control={signOutPromptControl}
        title={_(msg`Sign out?`)}
        description={_(msg`You will be signed out of all your accounts.`)}
        onConfirm={() => logoutEveryAccount('Settings')}
        confirmButtonCta={_(msg`Sign out`)}
        cancelButtonCta={_(msg`Cancel`)}
        confirmButtonColor="negative"
      />
    </View>
  )
}

interface NavItemProps {
  count?: string
  hasNew?: boolean
  href: string
  icon: JSX.Element
  iconFilled: JSX.Element
  label: string
}
function NavItem({count, hasNew, href, icon, iconFilled, label}: NavItemProps) {
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
        a.transition_color,
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
          <View
            style={[
              a.absolute,
              a.inset_0,
              {right: -20}, // more breathing room
            ]}>
            <Text
              accessibilityLabel={_(msg`${count} unread items`)}
              accessibilityHint=""
              accessible={true}
              numberOfLines={1}
              style={[
                a.absolute,
                a.text_xs,
                a.font_bold,
                a.rounded_full,
                a.text_center,
                a.leading_tight,
                {
                  top: '-10%',
                  left: count.length === 1 ? 12 : 8,
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
                    left: count.length === 1 ? 20 : 16,
                  },
                ],
              ]}>
              {count}
            </Text>
          </View>
        ) : hasNew ? (
          <View
            style={[
              a.absolute,
              a.rounded_full,
              {
                backgroundColor: t.palette.primary_500,
                width: 8,
                height: 8,
                right: -1,
                top: -3,
              },
              isTablet && {
                right: 6,
                top: 4,
              },
            ]}
          />
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
  const hasHomeBadge = useHomeBadge()
  const gate = useGate()

  if (!hasSession && !isDesktop) {
    return null
  }

  return (
    <View
      role="navigation"
      style={[
        a.px_xl,
        styles.leftNav,
        isTablet && styles.leftNavTablet,
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
          <NavItem
            href="/"
            hasNew={hasHomeBadge && gate('remove_show_latest_button')}
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
    left: '50%',
    transform: [
      {
        translateX: -300,
      },
      {
        translateX: '-100%',
      },
      ...a.scrollbar_offset.transform,
    ],
    width: 240,
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
    paddingLeft: 0,
    paddingRight: 0,
    alignItems: 'center',
    transform: [],
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
  },
})

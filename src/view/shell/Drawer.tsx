import {type ComponentProps, type JSX, memo, useCallback} from 'react'
import {
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {StackActions, useNavigation} from '@react-navigation/native'

import {useBrand} from '#/lib/community/BrandContext'
import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {type PressableScale} from '#/lib/custom-animations/PressableScale'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {type SharedNavTab, TAB_TO_NAV_ITEM} from '#/lib/routes/tab-to-nav-item'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {colors} from '#/lib/styles'
import {emitSoftReset} from '#/state/events'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession} from '#/state/session'
import {useSetDrawerOpen} from '#/state/shell'
import {formatCount} from '#/view/com/util/numeric/format'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {NavSignupCard} from '#/view/shell/NavSignupCard'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRight} from '#/components/icons/ArrowShareRight'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {Bookmark, BookmarkFilled} from '#/components/icons/Bookmark'
import {BulletList_Stroke2_Corner0_Rounded as List} from '#/components/icons/BulletList'
import {
  Hashtag_Filled_Corner0_Rounded as HashtagFilled,
  Hashtag_Stroke2_Corner0_Rounded as Hashtag,
} from '#/components/icons/Hashtag'
import {Heart2_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {
  MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
  MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
} from '#/components/icons/MagnifyingGlass'
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import {SettingsGear2_Stroke2_Corner0_Rounded as Settings} from '#/components/icons/SettingsGear2'
import {
  UserCircle_Filled_Corner0_Rounded as UserCircleFilled,
  UserCircle_Stroke2_Corner0_Rounded as UserCircle,
} from '#/components/icons/UserCircle'
import {InlineLinkText} from '#/components/Link'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'
import {InviteFriendsDialog} from '#/features/inviteFriends'
import {useActorStatus} from '#/features/liveNow'

const iconWidth = 26

let DrawerProfileCard = ({
  account,
  onPressProfile,
  onPressShare,
}: {
  account: SessionAccount
  onPressProfile: () => void
  onPressShare?: () => void
}): React.ReactNode => {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const {data: profile} = useProfileQuery({did: account.did})
  const {isActive: live} = useActorStatus(profile)

  return (
    <TouchableOpacity
      testID="profileCardButton"
      accessibilityLabel={_(msg`Profile`)}
      accessibilityHint={_(msg`Navigates to your profile`)}
      onPress={onPressProfile}
      style={[a.gap_sm, a.pr_lg]}>
      <UserAvatar
        size={52}
        avatar={profile?.avatar}
        // See https://github.com/bluesky-social/social-app/pull/1801:
        usePlainRNImage={true}
        type={profile?.associated?.labeler ? 'labeler' : 'user'}
        live={live}
      />
      <View style={[a.gap_2xs]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
          <Text
            emoji
            style={[
              a.font_bold,
              a.text_xl,
              a.mt_2xs,
              a.leading_tight,
              a.flex_shrink,
            ]}
            numberOfLines={1}>
            {profile?.displayName || account.handle}
          </Text>
          {profile && <ProfileBadges profile={profile} size="lg" />}
          {onPressShare && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={_(msg`Invite friends`)}
              accessibilityHint={_(
                msg`Opens the invite friends sheet to share your profile`,
              )}
              onPress={onPressShare}
              hitSlop={8}
              style={({pressed}) => [
                a.ml_auto,
                {
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: t.palette.contrast_50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ArrowShareRight
                width={16}
                height={16}
                fill={t.palette.primary_500}
              />
            </Pressable>
          )}
        </View>
        <Text
          emoji
          style={[t.atoms.text_contrast_medium, a.text_md, a.leading_tight]}
          numberOfLines={1}>
          {sanitizeHandle(account.handle, '@')}
        </Text>
      </View>
      <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
        <Text style={[a.text_md, a.font_semi_bold]}>
          {formatCount(i18n, profile?.followersCount ?? 0)}
        </Text>{' '}
        {i18n._(
          plural(profile?.followersCount || 0, {
            one: 'follower',
            other: 'followers',
          }),
        )}{' '}
        &middot;{' '}
        <Text style={[a.text_md, a.font_semi_bold]}>
          {formatCount(i18n, profile?.followsCount ?? 0)}
        </Text>{' '}
        {i18n._(
          plural(profile?.followsCount || 0, {
            one: 'following',
            other: 'following',
          }),
        )}
      </Text>
    </TouchableOpacity>
  )
}
DrawerProfileCard = memo(DrawerProfileCard)
export {DrawerProfileCard}

let DrawerContent = ({}: React.PropsWithoutRef<{}>): React.ReactNode => {
  const t = useTheme()
  const brand = useBrand()
  const insets = useSafeAreaInsets()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const ax = useAnalytics()
  const {
    isAtHome,
    isAtSearch,
    isAtFeeds,
    isAtBookmarks,
    isAtNotifications,
    isAtMyProfile,
    isAtMessages,
  } = useNavigationTabState()
  const {hasSession, currentAccount} = useSession()
  const inviteFriendsControl = useDialogControl()

  // events
  // =

  const onPressTab = useCallback(
    (tab: SharedNavTab, surface: 'drawer' | 'drawerHeader' = 'drawer') => {
      ax.metric('nav:click', {
        item: TAB_TO_NAV_ITEM[tab],
        surface,
      })
      const state = navigation.getState()
      setDrawerOpen(false)
      if (IS_WEB) {
        // hack because we have flat navigator for web and MyProfile does not exist on the web navigator -ansh
        if (tab === 'MyProfile') {
          navigation.navigate('Profile', {name: currentAccount!.handle})
        } else {
          // @ts-expect-error struggles with string unions, apparently
          navigation.navigate(tab)
        }
      } else {
        const tabState = getTabState(state, tab)
        if (tabState === TabState.InsideAtRoot) {
          emitSoftReset()
        } else if (tabState === TabState.Inside) {
          // find the correct navigator in which to pop-to-top
          const target = state.routes.find(route => route.name === `${tab}Tab`)
            ?.state?.key
          if (target) {
            // if we found it, trigger pop-to-top
            navigation.dispatch({
              ...StackActions.popToTop(),
              target,
            })
          } else {
            // fallback: reset navigation
            navigation.reset({
              index: 0,
              routes: [{name: `${tab}Tab`}],
            })
          }
        } else {
          navigation.navigate(`${tab}Tab`)
        }
      }
    },
    [navigation, setDrawerOpen, currentAccount, ax],
  )

  const onPressHome = useCallback(() => onPressTab('Home'), [onPressTab])

  const onPressSearch = useCallback(() => onPressTab('Search'), [onPressTab])

  const onPressMessages = useCallback(
    () => onPressTab('Messages'),
    [onPressTab],
  )

  const onPressNotifications = useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )

  const onPressProfile = useCallback(() => {
    onPressTab('MyProfile')
  }, [onPressTab])

  const onPressDrawerHeaderProfile = useCallback(() => {
    onPressTab('MyProfile', 'drawerHeader')
  }, [onPressTab])

  const onPressMyFeeds = useCallback(() => {
    ax.metric('nav:click', {item: 'feeds', surface: 'drawer'})
    navigation.navigate('Feeds')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen, ax])

  const onPressLists = useCallback(() => {
    ax.metric('nav:click', {item: 'lists', surface: 'drawer'})
    navigation.navigate('Lists')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen, ax])

  const onPressBookmarks = useCallback(() => {
    ax.metric('nav:click', {item: 'saved', surface: 'drawer'})
    navigation.navigate('Bookmarks')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen, ax])

  const onPressSettings = useCallback(() => {
    ax.metric('nav:click', {item: 'settings', surface: 'drawer'})
    navigation.navigate('Settings')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen, ax])

  const onPressSupport = useCallback(() => {
    navigation.navigate('Support')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen])

  const onPressFeedback = useCallback(() => {
    void Linking.openURL(
      FEEDBACK_FORM_URL({
        email: currentAccount?.email,
        handle: currentAccount?.handle,
      }),
    )
  }, [currentAccount])

  const onPressHelp = useCallback(() => {
    void Linking.openURL(HELP_DESK_URL)
  }, [])

  const onPressDiscuss = useCallback(() => {
    if (brand.web.links.community) {
      void Linking.openURL(brand.web.links.community)
    }
  }, [brand.web.links.community])

  const onPressContribute = useCallback(() => {
    if (brand.web.links.contribute) {
      void Linking.openURL(brand.web.links.contribute)
    }
  }, [brand.web.links.contribute])

  // rendering
  // =

  return (
    <View
      testID="drawer"
      style={[a.flex_1, a.border_r, t.atoms.bg, t.atoms.border_contrast_low]}>
      <ScrollView
        style={[a.flex_1]}
        contentContainerStyle={[
          {
            paddingTop: Math.max(
              insets.top + a.pt_xl.paddingTop,
              a.pt_xl.paddingTop,
            ),
          },
        ]}>
        <View style={[a.px_xl]}>
          {hasSession && currentAccount ? (
            <DrawerProfileCard
              account={currentAccount}
              onPressProfile={onPressDrawerHeaderProfile}
              onPressShare={
                IS_NATIVE
                  ? () => {
                      ax.metric('invite:dialog:open', {logContext: 'Drawer'})
                      setDrawerOpen(false)
                      inviteFriendsControl.open()
                    }
                  : undefined
              }
            />
          ) : (
            <View style={[a.pr_xl]}>
              <NavSignupCard />
            </View>
          )}

          <Divider style={[a.mt_xl, a.mb_sm]} />
        </View>

        {hasSession ? (
          <>
            <SearchMenuItem isActive={isAtSearch} onPress={onPressSearch} />
            <HomeMenuItem isActive={isAtHome} onPress={onPressHome} />
            <ChatMenuItem isActive={isAtMessages} onPress={onPressMessages} />
            <NotificationsMenuItem
              isActive={isAtNotifications}
              onPress={onPressNotifications}
            />
            <FeedsMenuItem isActive={isAtFeeds} onPress={onPressMyFeeds} />
            <ListsMenuItem onPress={onPressLists} />
            <BookmarksMenuItem
              isActive={isAtBookmarks}
              onPress={onPressBookmarks}
            />
            <ProfileMenuItem
              isActive={isAtMyProfile}
              onPress={onPressProfile}
            />
            <SettingsMenuItem onPress={onPressSettings} />
            <SupportMenuItem onPress={onPressSupport} />
          </>
        ) : (
          <>
            <HomeMenuItem isActive={isAtHome} onPress={onPressHome} />
            <FeedsMenuItem isActive={isAtFeeds} onPress={onPressMyFeeds} />
            <SearchMenuItem isActive={isAtSearch} onPress={onPressSearch} />
          </>
        )}

        <View style={[a.px_xl]}>
          <Divider style={[a.mb_xl, a.mt_sm]} />
          <ExtraLinks />
        </View>
      </ScrollView>

      <DrawerFooter
        onPressFeedback={onPressFeedback}
        onPressHelp={onPressHelp}
        onPressDiscuss={onPressDiscuss}
        onPressContribute={onPressContribute}
        showDiscuss={!!brand.web.links.community}
        showContribute={!!brand.web.links.contribute}
      />
      <InviteFriendsDialog control={inviteFriendsControl} />
    </View>
  )
}
DrawerContent = memo(DrawerContent)
export {DrawerContent}

let DrawerFooter = ({
  onPressFeedback,
  onPressHelp,
  onPressDiscuss,
  onPressContribute,
  showDiscuss,
  showContribute,
}: {
  onPressFeedback: () => void
  onPressHelp: () => void
  onPressDiscuss: () => void
  onPressContribute: () => void
  showDiscuss: boolean
  showContribute: boolean
}): React.ReactNode => {
  const {_} = useLingui()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        a.flex_row,
        a.gap_sm,
        a.flex_wrap,
        a.pl_xl,
        a.pt_md,
        {
          paddingBottom: Math.max(
            insets.bottom + tokens.space.xs,
            tokens.space.xl,
          ),
        },
      ]}>
      <Button
        label={_(msg`Send feedback`)}
        size="small"
        variant="solid"
        color="secondary"
        onPress={onPressFeedback}>
        <ButtonIcon icon={Message} position="left" />
        <ButtonText>
          <Trans>Feedback</Trans>
        </ButtonText>
      </Button>
      {showDiscuss ? (
        <Button
          label={_(msg`Begin Discussion`)}
          size="small"
          variant="solid"
          color="secondary"
          onPress={onPressDiscuss}>
          <ButtonIcon icon={Message} position="left" />
          <ButtonText>
            <Trans>Discussion</Trans>
          </ButtonText>
        </Button>
      ) : null}
      <Button
        label={_(msg`Get help`)}
        size="small"
        variant="outline"
        color="secondary"
        onPress={onPressHelp}
        style={{
          backgroundColor: 'transparent',
        }}>
        <ButtonText>
          <Trans>Help</Trans>
        </ButtonText>
      </Button>
      {showContribute ? (
        <Button
          label={_(msg`Support Us`)}
          size="small"
          variant="outline"
          color="secondary"
          onPress={onPressContribute}
          style={{
            backgroundColor: 'transparent',
          }}>
          <ButtonText>
            <Trans>Support Us</Trans>
          </ButtonText>
        </Button>
      ) : null}
    </View>
  )
}
DrawerFooter = memo(DrawerFooter)

interface MenuItemProps extends ComponentProps<typeof PressableScale> {
  icon: JSX.Element
  label: string
  count?: string
  bold?: boolean
}

let SearchMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <MagnifyingGlassFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <MagnifyingGlass style={[t.atoms.text]} width={iconWidth} />
        )
      }
      label={_(msg`Explore`)}
      bold={isActive}
      onPress={onPress}
    />
  )
}
SearchMenuItem = memo(SearchMenuItem)

let HomeMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <HomeFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <Home style={[t.atoms.text]} width={iconWidth} />
        )
      }
      label={_(msg`Home`)}
      bold={isActive}
      onPress={onPress}
    />
  )
}
HomeMenuItem = memo(HomeMenuItem)

let ChatMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <MessageFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <Message style={[t.atoms.text]} width={iconWidth} />
        )
      }
      label={_(msg`Chat`)}
      bold={isActive}
      onPress={onPress}
    />
  )
}
ChatMenuItem = memo(ChatMenuItem)

let NotificationsMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  const numUnreadNotifications = useUnreadNotifications()
  return (
    <MenuItem
      icon={
        isActive ? (
          <BellFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <Bell style={[t.atoms.text]} width={iconWidth} />
        )
      }
      label={_(msg`Notifications`)}
      accessibilityHint={
        numUnreadNotifications === ''
          ? ''
          : _(
              plural(numUnreadNotifications ?? 0, {
                one: '# unread item',
                other: '# unread items',
              }),
            )
      }
      count={numUnreadNotifications}
      bold={isActive}
      onPress={onPress}
    />
  )
}
NotificationsMenuItem = memo(NotificationsMenuItem)

let FeedsMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <HashtagFilled width={iconWidth} style={[t.atoms.text]} />
        ) : (
          <Hashtag width={iconWidth} style={[t.atoms.text]} />
        )
      }
      label={_(msg`Feeds`)}
      bold={isActive}
      onPress={onPress}
    />
  )
}
FeedsMenuItem = memo(FeedsMenuItem)

let ListsMenuItem = ({onPress}: {onPress: () => void}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <MenuItem
      icon={<List style={[t.atoms.text]} width={iconWidth} />}
      label={_(msg`Lists`)}
      onPress={onPress}
    />
  )
}
ListsMenuItem = memo(ListsMenuItem)

let BookmarksMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <MenuItem
      icon={
        isActive ? (
          <BookmarkFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <Bookmark style={[t.atoms.text]} width={iconWidth} />
        )
      }
      label={_(msg({message: 'Saved', context: 'link to bookmarks screen'}))}
      onPress={onPress}
    />
  )
}
BookmarksMenuItem = memo(BookmarksMenuItem)

let ProfileMenuItem = ({
  isActive,
  onPress,
}: {
  isActive: boolean
  onPress: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  return (
    <MenuItem
      icon={
        isActive ? (
          <UserCircleFilled style={[t.atoms.text]} width={iconWidth} />
        ) : (
          <UserCircle style={[t.atoms.text]} width={iconWidth} />
        )
      }
      label={_(msg`Profile`)}
      onPress={onPress}
    />
  )
}
ProfileMenuItem = memo(ProfileMenuItem)

let SettingsMenuItem = ({onPress}: {onPress: () => void}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  return (
    <MenuItem
      icon={<Settings style={[t.atoms.text]} width={iconWidth} />}
      label={_(msg`Settings`)}
      onPress={onPress}
    />
  )
}
SettingsMenuItem = memo(SettingsMenuItem)

let SupportMenuItem = ({onPress}: {onPress: () => void}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()
  return (
    <MenuItem
      icon={<Heart style={[t.atoms.text]} width={iconWidth} />}
      label={_(msg`Support Us`)}
      onPress={onPress}
    />
  )
}
SupportMenuItem = memo(SupportMenuItem)

function MenuItem({icon, label, count, bold, onPress}: MenuItemProps) {
  const t = useTheme()
  return (
    <Button
      testID={`menuItemButton-${label}`}
      onPress={onPress}
      accessibilityRole="tab"
      label={label}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.gap_md,
            a.py_md,
            a.px_xl,
            (hovered || pressed) && t.atoms.bg_contrast_25,
          ]}>
          <View style={[a.relative]}>
            {icon}
            {count ? (
              <View
                style={[
                  a.absolute,
                  a.inset_0,
                  a.align_end,
                  {top: -4, right: a.gap_sm.gap * -1},
                ]}>
                <View
                  style={[
                    a.rounded_full,
                    {
                      right: count.length === 1 ? 6 : 0,
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                      backgroundColor: t.palette.primary_500,
                    },
                  ]}>
                  <Text
                    style={[
                      a.text_xs,
                      a.leading_tight,
                      a.font_semi_bold,
                      {
                        fontVariant: ['tabular-nums'],
                        color: colors.white,
                      },
                    ]}
                    numberOfLines={1}>
                    {count}
                  </Text>
                </View>
              </View>
            ) : undefined}
          </View>
          <Text
            style={[
              a.flex_1,
              a.text_2xl,
              bold && a.font_bold,
              web(a.leading_snug),
            ]}
            numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Button>
  )
}

function ExtraLinks() {
  const {_} = useLingui()
  const t = useTheme()
  const kawaii = useKawaiiMode()
  const brand = useBrand()

  return (
    <View style={[a.flex_col, a.gap_md, a.flex_wrap]}>
      <InlineLinkText
        style={[a.text_md]}
        label={_(msg`Terms of Service`)}
        to={brand.web.links.tos}>
        <Trans>Terms of Service</Trans>
      </InlineLinkText>
      <InlineLinkText
        style={[a.text_md]}
        to={brand.web.links.privacy}
        label={_(msg`Privacy Policy`)}>
        <Trans>Privacy Policy</Trans>
      </InlineLinkText>
      {kawaii && (
        <Text style={t.atoms.text_contrast_medium}>
          <Trans>
            Logo by{' '}
            <InlineLinkText
              style={[a.text_md]}
              to="/profile/sawaratsuki.bsky.social"
              label="@sawaratsuki.bsky.social">
              @sawaratsuki.bsky.social
            </InlineLinkText>
          </Trans>
        </Text>
      )}
    </View>
  )
}

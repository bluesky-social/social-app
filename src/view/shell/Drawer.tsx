import React, {type ComponentProps} from 'react'
import {Linking, ScrollView, TouchableOpacity, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Plural, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'

import {useActorStatus} from '#/lib/actor-status'
import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {type PressableScale} from '#/lib/custom-animations/PressableScale'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {colors} from '#/lib/styles'
import {isWeb} from '#/platform/detection'
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
import {Divider} from '#/components/Divider'
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
import {SettingsGear2_Stroke2_Corner0_Rounded as Settings} from '#/components/icons/SettingsGear2'
import {
  UserCircle_Filled_Corner0_Rounded as UserCircleFilled,
  UserCircle_Stroke2_Corner0_Rounded as UserCircle,
} from '#/components/icons/UserCircle'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'

const iconWidth = 26

let DrawerProfileCard = ({
  account,
  onPressProfile,
}: {
  account: SessionAccount
  onPressProfile: () => void
}): React.ReactNode => {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const {data: profile} = useProfileQuery({did: account.did})
  const verification = useSimpleVerificationState({profile})
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
            style={[a.font_heavy, a.text_xl, a.mt_2xs, a.leading_tight]}
            numberOfLines={1}>
            {profile?.displayName || account.handle}
          </Text>
          {verification.showBadge && (
            <View
              style={{
                top: 0,
              }}>
              <VerificationCheck
                width={16}
                verifier={verification.role === 'verifier'}
              />
            </View>
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
        <Trans>
          <Text style={[a.text_md, a.font_bold]}>
            {formatCount(i18n, profile?.followersCount ?? 0)}
          </Text>{' '}
          <Plural
            value={profile?.followersCount || 0}
            one="follower"
            other="followers"
          />
        </Trans>{' '}
        &middot;{' '}
        <Trans>
          <Text style={[a.text_md, a.font_bold]}>
            {formatCount(i18n, profile?.followsCount ?? 0)}
          </Text>{' '}
          <Plural
            value={profile?.followsCount || 0}
            one="following"
            other="following"
          />
        </Trans>
      </Text>
    </TouchableOpacity>
  )
}
DrawerProfileCard = React.memo(DrawerProfileCard)
export {DrawerProfileCard}

let DrawerContent = ({}: React.PropsWithoutRef<{}>): React.ReactNode => {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
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

  // events
  // =

  const onPressTab = React.useCallback(
    (tab: 'Home' | 'Search' | 'Messages' | 'Notifications' | 'MyProfile') => {
      const state = navigation.getState()
      setDrawerOpen(false)
      if (isWeb) {
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
    [navigation, setDrawerOpen, currentAccount],
  )

  const onPressHome = React.useCallback(() => onPressTab('Home'), [onPressTab])

  const onPressSearch = React.useCallback(
    () => onPressTab('Search'),
    [onPressTab],
  )

  const onPressMessages = React.useCallback(
    () => onPressTab('Messages'),
    [onPressTab],
  )

  const onPressNotifications = React.useCallback(
    () => onPressTab('Notifications'),
    [onPressTab],
  )

  const onPressProfile = React.useCallback(() => {
    onPressTab('MyProfile')
  }, [onPressTab])

  const onPressMyFeeds = React.useCallback(() => {
    navigation.navigate('Feeds')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen])

  const onPressLists = React.useCallback(() => {
    navigation.navigate('Lists')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen])

  const onPressBookmarks = React.useCallback(() => {
    navigation.navigate('Bookmarks')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen])

  const onPressSettings = React.useCallback(() => {
    navigation.navigate('Settings')
    setDrawerOpen(false)
  }, [navigation, setDrawerOpen])

  const onPressFeedback = React.useCallback(() => {
    Linking.openURL(
      FEEDBACK_FORM_URL({
        email: currentAccount?.email,
        handle: currentAccount?.handle,
      }),
    )
  }, [currentAccount])

  const onPressHelp = React.useCallback(() => {
    Linking.openURL(HELP_DESK_URL)
  }, [])

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
              onPressProfile={onPressProfile}
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
      />
    </View>
  )
}
DrawerContent = React.memo(DrawerContent)
export {DrawerContent}

let DrawerFooter = ({
  onPressFeedback,
  onPressHelp,
}: {
  onPressFeedback: () => void
  onPressHelp: () => void
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
    </View>
  )
}
DrawerFooter = React.memo(DrawerFooter)

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
SearchMenuItem = React.memo(SearchMenuItem)

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
HomeMenuItem = React.memo(HomeMenuItem)

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
ChatMenuItem = React.memo(ChatMenuItem)

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
              msg`${plural(numUnreadNotifications ?? 0, {
                one: '# unread item',
                other: '# unread items',
              })}` || '',
            )
      }
      count={numUnreadNotifications}
      bold={isActive}
      onPress={onPress}
    />
  )
}
NotificationsMenuItem = React.memo(NotificationsMenuItem)

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
FeedsMenuItem = React.memo(FeedsMenuItem)

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
ListsMenuItem = React.memo(ListsMenuItem)

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
      label={_(msg`Saved`)}
      onPress={onPress}
    />
  )
}
BookmarksMenuItem = React.memo(BookmarksMenuItem)

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
ProfileMenuItem = React.memo(ProfileMenuItem)

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
SettingsMenuItem = React.memo(SettingsMenuItem)

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
                      a.font_bold,
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
              bold && a.font_heavy,
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

  return (
    <View style={[a.flex_col, a.gap_md, a.flex_wrap]}>
      <InlineLinkText
        style={[a.text_md]}
        label={_(msg`Terms of Service`)}
        to="https://bsky.social/about/support/tos">
        <Trans>Terms of Service</Trans>
      </InlineLinkText>
      <InlineLinkText
        style={[a.text_md]}
        to="https://bsky.social/about/support/privacy-policy"
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

import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {
  AppBskyActorDefs,
  ProfileModeration,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NavigationProp} from 'lib/routes/types'
import {isNative} from 'platform/detection'
import {BlurView} from '../util/BlurView'
import {ProfileImageLightbox} from 'state/models/ui/shell'
import * as Toast from '../util/Toast'
import {LoadingPlaceholder} from '../util/LoadingPlaceholder'
import {Text} from '../util/text/Text'
import {ThemedText} from '../util/text/ThemedText'
import {RichText} from '../util/text/RichText'
import {UserAvatar} from '../util/UserAvatar'
import {UserBanner} from '../util/UserBanner'
import {ProfileHeaderAlerts} from '../util/moderation/ProfileHeaderAlerts'
import {formatCount} from '../util/numeric/format'
import {NativeDropdown, DropdownItem} from '../util/forms/NativeDropdown'
import {Link} from '../util/Link'
import {ProfileHeaderSuggestedFollows} from './ProfileHeaderSuggestedFollows'
import {useStores} from 'state/index'
import {useModalControls} from '#/state/modals'
import {
  useProfileFollowMutation,
  useProfileUnfollowMutation,
  useProfileMuteMutation,
  useProfileUnmuteMutation,
  useProfileBlockMutation,
  useProfileUnblockMutation,
} from '#/state/queries/profile'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {BACK_HITSLOP} from 'lib/constants'
import {isInvalidHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {pluralize} from 'lib/strings/helpers'
import {toShareUrl} from 'lib/strings/url-helpers'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {shareUrl} from 'lib/sharing'
import {s, colors} from 'lib/styles'
import {logger} from '#/logger'
import {useSession} from '#/state/session'

interface Props {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderation: ProfileModeration
  hideBackButton?: boolean
  isProfilePreview?: boolean
}

export function ProfileHeader({
  profile,
  moderation,
  hideBackButton = false,
  isProfilePreview,
}: Props) {
  const pal = usePalette('default')

  // loading
  // =
  if (!profile) {
    return (
      <View style={pal.view}>
        <LoadingPlaceholder width="100%" height={153} />
        <View
          style={[pal.view, {borderColor: pal.colors.background}, styles.avi]}>
          <LoadingPlaceholder width={80} height={80} style={styles.br40} />
        </View>
        <View style={styles.content}>
          <View style={[styles.buttonsLine]}>
            <LoadingPlaceholder width={167} height={31} style={styles.br50} />
          </View>
          <View>
            <Text type="title-2xl" style={[pal.text, styles.title]}>
              <Trans>Loading...</Trans>
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // loaded
  // =
  return (
    <ProfileHeaderLoaded
      profile={profile}
      moderation={moderation}
      hideBackButton={hideBackButton}
      isProfilePreview={isProfilePreview}
    />
  )
}

function ProfileHeaderLoaded({
  profile,
  moderation,
  hideBackButton = false,
  isProfilePreview,
}: Props) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const store = useStores()
  const {currentAccount} = useSession()
  const {_} = useLingui()
  const {openModal} = useModalControls()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()
  const invalidHandle = isInvalidHandle(profile.handle)
  const {isDesktop} = useWebMediaQueries()
  const [showSuggestedFollows, setShowSuggestedFollows] = React.useState(false)
  const descriptionRT = React.useMemo(
    () =>
      profile.description
        ? new RichTextAPI({text: profile.description})
        : undefined,
    [profile],
  )
  const followMutation = useProfileFollowMutation()
  const unfollowMutation = useProfileUnfollowMutation()
  const muteMutation = useProfileMuteMutation()
  const unmuteMutation = useProfileUnmuteMutation()
  const blockMutation = useProfileBlockMutation()
  const unblockMutation = useProfileUnblockMutation()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  const onPressAvi = React.useCallback(() => {
    if (
      profile.avatar &&
      !(moderation.avatar.blur && moderation.avatar.noOverride)
    ) {
      store.shell.openLightbox(new ProfileImageLightbox(profile))
    }
  }, [store, profile, moderation])

  const onPressFollow = React.useCallback(async () => {
    if (profile.viewer?.following) {
      return
    }
    try {
      track('ProfileHeader:FollowButtonClicked')
      await followMutation.mutateAsync({did: profile.did})
      Toast.show(
        `Following ${sanitizeDisplayName(
          profile.displayName || profile.handle,
        )}`,
      )
    } catch (e: any) {
      logger.error('Failed to follow', {error: String(e)})
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [followMutation, profile, track])

  const onPressUnfollow = React.useCallback(async () => {
    if (!profile.viewer?.following) {
      return
    }
    try {
      track('ProfileHeader:UnfollowButtonClicked')
      await unfollowMutation.mutateAsync({
        did: profile.did,
        followUri: profile.viewer?.following,
      })
      Toast.show(
        `No longer following ${sanitizeDisplayName(
          profile.displayName || profile.handle,
        )}`,
      )
    } catch (e: any) {
      logger.error('Failed to unfollow', {error: String(e)})
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [unfollowMutation, profile, track])

  const onPressEditProfile = React.useCallback(() => {
    track('ProfileHeader:EditProfileButtonClicked')
    openModal({
      name: 'edit-profile',
      profile,
    })
  }, [track, openModal, profile])

  const onPressShare = React.useCallback(() => {
    track('ProfileHeader:ShareButtonClicked')
    shareUrl(toShareUrl(makeProfileLink(profile)))
  }, [track, profile])

  const onPressAddRemoveLists = React.useCallback(() => {
    track('ProfileHeader:AddToListsButtonClicked')
    openModal({
      name: 'user-add-remove-lists',
      subject: profile.did,
      displayName: profile.displayName || profile.handle,
    })
  }, [track, profile, openModal])

  const onPressMuteAccount = React.useCallback(async () => {
    track('ProfileHeader:MuteAccountButtonClicked')
    try {
      await muteMutation.mutateAsync({did: profile.did})
      Toast.show('Account muted')
    } catch (e: any) {
      logger.error('Failed to mute account', {error: e})
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [track, muteMutation, profile])

  const onPressUnmuteAccount = React.useCallback(async () => {
    track('ProfileHeader:UnmuteAccountButtonClicked')
    try {
      await unmuteMutation.mutateAsync({did: profile.did})
      Toast.show('Account unmuted')
    } catch (e: any) {
      logger.error('Failed to unmute account', {error: e})
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [track, unmuteMutation, profile])

  const onPressBlockAccount = React.useCallback(async () => {
    track('ProfileHeader:BlockAccountButtonClicked')
    openModal({
      name: 'confirm',
      title: 'Block Account',
      message:
        'Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.',
      onPressConfirm: async () => {
        if (profile.viewer?.blocking) {
          return
        }
        try {
          await blockMutation.mutateAsync({did: profile.did})
          Toast.show('Account blocked')
        } catch (e: any) {
          logger.error('Failed to block account', {error: e})
          Toast.show(`There was an issue! ${e.toString()}`)
        }
      },
    })
  }, [track, blockMutation, profile, openModal])

  const onPressUnblockAccount = React.useCallback(async () => {
    track('ProfileHeader:UnblockAccountButtonClicked')
    openModal({
      name: 'confirm',
      title: 'Unblock Account',
      message:
        'The account will be able to interact with you after unblocking.',
      onPressConfirm: async () => {
        if (!profile.viewer?.blocking) {
          return
        }
        try {
          await unblockMutation.mutateAsync({
            did: profile.did,
            blockUri: profile.viewer.blocking,
          })
          Toast.show('Account unblocked')
        } catch (e: any) {
          logger.error('Failed to unblock account', {error: e})
          Toast.show(`There was an issue! ${e.toString()}`)
        }
      },
    })
  }, [track, unblockMutation, profile, openModal])

  const onPressReportAccount = React.useCallback(() => {
    track('ProfileHeader:ReportAccountButtonClicked')
    openModal({
      name: 'report',
      did: profile.did,
    })
  }, [track, openModal, profile])

  const isMe = React.useMemo(
    () => currentAccount?.did === profile.did,
    [currentAccount, profile],
  )
  const dropdownItems: DropdownItem[] = React.useMemo(() => {
    let items: DropdownItem[] = [
      {
        testID: 'profileHeaderDropdownShareBtn',
        label: 'Share',
        onPress: onPressShare,
        icon: {
          ios: {
            name: 'square.and.arrow.up',
          },
          android: 'ic_menu_share',
          web: 'share',
        },
      },
    ]
    items.push({label: 'separator'})
    items.push({
      testID: 'profileHeaderDropdownListAddRemoveBtn',
      label: 'Add to Lists',
      onPress: onPressAddRemoveLists,
      icon: {
        ios: {
          name: 'list.bullet',
        },
        android: 'ic_menu_add',
        web: 'list',
      },
    })
    if (!isMe) {
      if (!profile.viewer?.blocking) {
        items.push({
          testID: 'profileHeaderDropdownMuteBtn',
          label: profile.viewer?.muted ? 'Unmute Account' : 'Mute Account',
          onPress: profile.viewer?.muted
            ? onPressUnmuteAccount
            : onPressMuteAccount,
          icon: {
            ios: {
              name: 'speaker.slash',
            },
            android: 'ic_lock_silent_mode',
            web: 'comment-slash',
          },
        })
      }
      if (!profile.viewer?.blockingByList) {
        items.push({
          testID: 'profileHeaderDropdownBlockBtn',
          label: profile.viewer?.blocking ? 'Unblock Account' : 'Block Account',
          onPress: profile.viewer?.blocking
            ? onPressUnblockAccount
            : onPressBlockAccount,
          icon: {
            ios: {
              name: 'person.fill.xmark',
            },
            android: 'ic_menu_close_clear_cancel',
            web: 'user-slash',
          },
        })
      }
      items.push({
        testID: 'profileHeaderDropdownReportBtn',
        label: 'Report Account',
        onPress: onPressReportAccount,
        icon: {
          ios: {
            name: 'exclamationmark.triangle',
          },
          android: 'ic_menu_report_image',
          web: 'circle-exclamation',
        },
      })
    }
    return items
  }, [
    isMe,
    profile.viewer?.muted,
    profile.viewer?.blocking,
    profile.viewer?.blockingByList,
    onPressShare,
    onPressUnmuteAccount,
    onPressMuteAccount,
    onPressUnblockAccount,
    onPressBlockAccount,
    onPressReportAccount,
    onPressAddRemoveLists,
  ])

  const blockHide =
    !isMe && (profile.viewer?.blocking || profile.viewer?.blockedBy)
  const following = formatCount(profile.followsCount || 0)
  const followers = formatCount(profile.followersCount || 0)
  const pluralizedFollowers = pluralize(profile.followersCount || 0, 'follower')

  return (
    <View style={pal.view}>
      <UserBanner banner={profile.banner} moderation={moderation.avatar} />
      <View style={styles.content}>
        <View style={[styles.buttonsLine]}>
          {isMe ? (
            <TouchableOpacity
              testID="profileHeaderEditProfileButton"
              onPress={onPressEditProfile}
              style={[styles.btn, styles.mainBtn, pal.btn]}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Edit profile`)}
              accessibilityHint="Opens editor for profile display name, avatar, background image, and description">
              <Text type="button" style={pal.text}>
                <Trans>Edit Profile</Trans>
              </Text>
            </TouchableOpacity>
          ) : profile.viewer?.blocking ? (
            profile.viewer?.blockingByList ? null : (
              <TouchableOpacity
                testID="unblockBtn"
                onPress={onPressUnblockAccount}
                style={[styles.btn, styles.mainBtn, pal.btn]}
                accessibilityRole="button"
                accessibilityLabel={_(msg`Unblock`)}
                accessibilityHint="">
                <Text type="button" style={[pal.text, s.bold]}>
                  <Trans>Unblock</Trans>
                </Text>
              </TouchableOpacity>
            )
          ) : !profile.viewer?.blockedBy ? (
            <>
              {!isProfilePreview && (
                <TouchableOpacity
                  testID="suggestedFollowsBtn"
                  onPress={() => setShowSuggestedFollows(!showSuggestedFollows)}
                  style={[
                    styles.btn,
                    styles.mainBtn,
                    pal.btn,
                    {
                      paddingHorizontal: 10,
                      backgroundColor: showSuggestedFollows
                        ? pal.colors.text
                        : pal.colors.backgroundLight,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Show follows similar to ${profile.handle}`}
                  accessibilityHint={`Shows a list of users similar to this user.`}>
                  <FontAwesomeIcon
                    icon="user-plus"
                    style={[
                      pal.text,
                      {
                        color: showSuggestedFollows
                          ? colors.white
                          : pal.text.color,
                      },
                    ]}
                    size={14}
                  />
                </TouchableOpacity>
              )}

              {profile.viewer?.following ? (
                <TouchableOpacity
                  testID="unfollowBtn"
                  onPress={onPressUnfollow}
                  style={[styles.btn, styles.mainBtn, pal.btn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Unfollow ${profile.handle}`}
                  accessibilityHint={`Hides posts from ${profile.handle} in your feed`}>
                  <FontAwesomeIcon
                    icon="check"
                    style={[pal.text, s.mr5]}
                    size={14}
                  />
                  <Text type="button" style={pal.text}>
                    <Trans>Following</Trans>
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  testID="followBtn"
                  onPress={onPressFollow}
                  style={[styles.btn, styles.mainBtn, palInverted.view]}
                  accessibilityRole="button"
                  accessibilityLabel={`Follow ${profile.handle}`}
                  accessibilityHint={`Shows posts from ${profile.handle} in your feed`}>
                  <FontAwesomeIcon
                    icon="plus"
                    style={[palInverted.text, s.mr5]}
                  />
                  <Text type="button" style={[palInverted.text, s.bold]}>
                    <Trans>Follow</Trans>
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
          {dropdownItems?.length ? (
            <NativeDropdown
              testID="profileHeaderDropdownBtn"
              items={dropdownItems}
              accessibilityLabel={_(msg`More options`)}
              accessibilityHint="">
              <View style={[styles.btn, styles.secondaryBtn, pal.btn]}>
                <FontAwesomeIcon icon="ellipsis" size={20} style={[pal.text]} />
              </View>
            </NativeDropdown>
          ) : undefined}
        </View>
        <View>
          <Text
            testID="profileHeaderDisplayName"
            type="title-2xl"
            style={[pal.text, styles.title]}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.profile,
            )}
          </Text>
        </View>
        <View style={styles.handleLine}>
          {profile.viewer?.followedBy && !blockHide ? (
            <View style={[styles.pill, pal.btn, s.mr5]}>
              <Text type="xs" style={[pal.text]}>
                <Trans>Follows you</Trans>
              </Text>
            </View>
          ) : undefined}
          <ThemedText
            type={invalidHandle ? 'xs' : 'md'}
            fg={invalidHandle ? 'error' : 'light'}
            border={invalidHandle ? 'error' : undefined}
            style={[
              invalidHandle ? styles.invalidHandle : undefined,
              styles.handle,
            ]}>
            {invalidHandle ? '⚠Invalid Handle' : `@${profile.handle}`}
          </ThemedText>
        </View>
        {!blockHide && (
          <>
            <View style={styles.metricsLine}>
              <Link
                testID="profileHeaderFollowersButton"
                style={[s.flexRow, s.mr10]}
                href={makeProfileLink(profile, 'followers')}
                onPressOut={() =>
                  track(`ProfileHeader:FollowersButtonClicked`, {
                    handle: profile.handle,
                  })
                }
                asAnchor
                accessibilityLabel={`${followers} ${pluralizedFollowers}`}
                accessibilityHint={'Opens followers list'}>
                <Text type="md" style={[s.bold, pal.text]}>
                  {followers}{' '}
                </Text>
                <Text type="md" style={[pal.textLight]}>
                  {pluralizedFollowers}
                </Text>
              </Link>
              <Link
                testID="profileHeaderFollowsButton"
                style={[s.flexRow, s.mr10]}
                href={makeProfileLink(profile, 'follows')}
                onPressOut={() =>
                  track(`ProfileHeader:FollowsButtonClicked`, {
                    handle: profile.handle,
                  })
                }
                asAnchor
                accessibilityLabel={`${following} following`}
                accessibilityHint={'Opens following list'}>
                <Text type="md" style={[s.bold, pal.text]}>
                  {following}{' '}
                </Text>
                <Text type="md" style={[pal.textLight]}>
                  <Trans>following</Trans>
                </Text>
              </Link>
              <Text type="md" style={[s.bold, pal.text]}>
                {formatCount(profile.postsCount || 0)}{' '}
                <Text type="md" style={[pal.textLight]}>
                  {pluralize(profile.postsCount || 0, 'post')}
                </Text>
              </Text>
            </View>
            {descriptionRT && !moderation.profile.blur ? (
              <RichText
                testID="profileHeaderDescription"
                style={[styles.description, pal.text]}
                numberOfLines={15}
                richText={descriptionRT}
              />
            ) : undefined}
          </>
        )}
        <ProfileHeaderAlerts moderation={moderation} />
      </View>

      {!isProfilePreview && (
        <ProfileHeaderSuggestedFollows
          actorDid={profile.did}
          active={showSuggestedFollows}
          requestDismiss={() => setShowSuggestedFollows(!showSuggestedFollows)}
        />
      )}

      {!isDesktop && !hideBackButton && (
        <TouchableWithoutFeedback
          testID="profileHeaderBackBtn"
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Back`)}
          accessibilityHint="">
          <View style={styles.backBtnWrapper}>
            <BlurView style={styles.backBtn} blurType="dark">
              <FontAwesomeIcon size={18} icon="angle-left" style={s.white} />
            </BlurView>
          </View>
        </TouchableWithoutFeedback>
      )}
      <TouchableWithoutFeedback
        testID="profileHeaderAviButton"
        onPress={onPressAvi}
        accessibilityRole="image"
        accessibilityLabel={`View ${profile.handle}'s avatar`}
        accessibilityHint="">
        <View
          style={[pal.view, {borderColor: pal.colors.background}, styles.avi]}>
          <UserAvatar
            size={80}
            avatar={profile.avatar}
            moderation={moderation.avatar}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    height: 120,
  },
  backBtnWrapper: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    overflow: 'hidden',
    borderRadius: 15,
    // @ts-ignore web only
    cursor: 'pointer',
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avi: {
    position: 'absolute',
    top: 110,
    left: 10,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },

  buttonsLine: {
    flexDirection: 'row',
    marginLeft: 'auto',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.blue3,
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  mainBtn: {
    paddingHorizontal: 24,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
  },
  title: {lineHeight: 38},

  // Word wrapping appears fine on
  // mobile but overflows on desktop
  handle: isNative
    ? {}
    : {
        // @ts-ignore web only -prf
        wordBreak: 'break-all',
      },
  invalidHandle: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
  },

  handleLine: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  metricsLine: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  description: {
    marginBottom: 8,
  },

  detailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  pill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  br40: {borderRadius: 40},
  br50: {borderRadius: 50},
})

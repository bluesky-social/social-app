import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {BlurView} from '../util/BlurView'
import {ProfileModel} from 'state/models/content/profile'
import {useStores} from 'state/index'
import {ProfileImageLightbox} from 'state/models/ui/shell'
import {pluralize} from 'lib/strings/helpers'
import {toShareUrl} from 'lib/strings/url-helpers'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {s, colors} from 'lib/styles'
import * as Toast from '../util/Toast'
import {LoadingPlaceholder} from '../util/LoadingPlaceholder'
import {Text} from '../util/text/Text'
import {ThemedText} from '../util/text/ThemedText'
import {RichText} from '../util/text/RichText'
import {UserAvatar} from '../util/UserAvatar'
import {UserBanner} from '../util/UserBanner'
import {ProfileHeaderAlerts} from '../util/moderation/ProfileHeaderAlerts'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {isNative} from 'platform/detection'
import {FollowState} from 'state/models/cache/my-follows'
import {shareUrl} from 'lib/sharing'
import {formatCount} from '../util/numeric/format'
import {NativeDropdown, DropdownItem} from '../util/forms/NativeDropdown'
import {BACK_HITSLOP} from 'lib/constants'
import {isInvalidHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {Link} from '../util/Link'
import {ProfileHeaderSuggestedFollows} from './ProfileHeaderSuggestedFollows'

interface Props {
  view: ProfileModel
  onRefreshAll: () => void
  hideBackButton?: boolean
  isProfilePreview?: boolean
}

export const ProfileHeader = observer(function ProfileHeaderImpl({
  view,
  onRefreshAll,
  hideBackButton = false,
  isProfilePreview,
}: Props) {
  const pal = usePalette('default')

  // loading
  // =
  if (!view || !view.hasLoaded) {
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
              {sanitizeDisplayName(
                view.displayName || sanitizeHandle(view.handle),
              )}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // error
  // =
  if (view.hasError) {
    return (
      <View testID="profileHeaderHasError">
        <Text>{view.error}</Text>
      </View>
    )
  }

  // loaded
  // =
  return (
    <ProfileHeaderLoaded
      view={view}
      onRefreshAll={onRefreshAll}
      hideBackButton={hideBackButton}
      isProfilePreview={isProfilePreview}
    />
  )
})

const ProfileHeaderLoaded = observer(function ProfileHeaderLoadedImpl({
  view,
  onRefreshAll,
  hideBackButton = false,
  isProfilePreview,
}: Props) {
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()
  const invalidHandle = isInvalidHandle(view.handle)
  const {isDesktop} = useWebMediaQueries()
  const [showSuggestedFollows, setShowSuggestedFollows] = React.useState(false)

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  const onPressAvi = React.useCallback(() => {
    if (
      view.avatar &&
      !(view.moderation.avatar.blur && view.moderation.avatar.noOverride)
    ) {
      store.shell.openLightbox(new ProfileImageLightbox(view))
    }
  }, [store, view])

  const onPressToggleFollow = React.useCallback(() => {
    view?.toggleFollowing().then(
      () => {
        setShowSuggestedFollows(Boolean(view.viewer.following))
        Toast.show(
          `${
            view.viewer.following ? 'Following' : 'No longer following'
          } ${sanitizeDisplayName(view.displayName || view.handle)}`,
        )
        track(
          view.viewer.following
            ? 'ProfileHeader:FollowButtonClicked'
            : 'ProfileHeader:UnfollowButtonClicked',
        )
      },
      err => store.log.error('Failed to toggle follow', err),
    )
  }, [track, view, store.log, setShowSuggestedFollows])

  const onPressEditProfile = React.useCallback(() => {
    track('ProfileHeader:EditProfileButtonClicked')
    store.shell.openModal({
      name: 'edit-profile',
      profileView: view,
      onUpdate: onRefreshAll,
    })
  }, [track, store, view, onRefreshAll])

  const trackPress = React.useCallback(
    (f: 'Followers' | 'Follows') => {
      track(`ProfileHeader:${f}ButtonClicked`, {
        handle: view.handle,
      })
    },
    [track, view],
  )

  const onPressShare = React.useCallback(() => {
    track('ProfileHeader:ShareButtonClicked')
    const url = toShareUrl(makeProfileLink(view))
    shareUrl(url)
  }, [track, view])

  const onPressAddRemoveLists = React.useCallback(() => {
    track('ProfileHeader:AddToListsButtonClicked')
    store.shell.openModal({
      name: 'user-add-remove-lists',
      subject: view.did,
      displayName: view.displayName || view.handle,
    })
  }, [track, view, store])

  const onPressMuteAccount = React.useCallback(async () => {
    track('ProfileHeader:MuteAccountButtonClicked')
    try {
      await view.muteAccount()
      Toast.show('Account muted')
    } catch (e: any) {
      store.log.error('Failed to mute account', e)
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [track, view, store])

  const onPressUnmuteAccount = React.useCallback(async () => {
    track('ProfileHeader:UnmuteAccountButtonClicked')
    try {
      await view.unmuteAccount()
      Toast.show('Account unmuted')
    } catch (e: any) {
      store.log.error('Failed to unmute account', e)
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }, [track, view, store])

  const onPressBlockAccount = React.useCallback(async () => {
    track('ProfileHeader:BlockAccountButtonClicked')
    store.shell.openModal({
      name: 'confirm',
      title: 'Block Account',
      message:
        'Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.',
      onPressConfirm: async () => {
        try {
          await view.blockAccount()
          onRefreshAll()
          Toast.show('Account blocked')
        } catch (e: any) {
          store.log.error('Failed to block account', e)
          Toast.show(`There was an issue! ${e.toString()}`)
        }
      },
    })
  }, [track, view, store, onRefreshAll])

  const onPressUnblockAccount = React.useCallback(async () => {
    track('ProfileHeader:UnblockAccountButtonClicked')
    store.shell.openModal({
      name: 'confirm',
      title: 'Unblock Account',
      message:
        'The account will be able to interact with you after unblocking.',
      onPressConfirm: async () => {
        try {
          await view.unblockAccount()
          onRefreshAll()
          Toast.show('Account unblocked')
        } catch (e: any) {
          store.log.error('Failed to unblock account', e)
          Toast.show(`There was an issue! ${e.toString()}`)
        }
      },
    })
  }, [track, view, store, onRefreshAll])

  const onPressReportAccount = React.useCallback(() => {
    track('ProfileHeader:ReportAccountButtonClicked')
    store.shell.openModal({
      name: 'report',
      did: view.did,
    })
  }, [track, store, view])

  const isMe = React.useMemo(
    () => store.me.did === view.did,
    [store.me.did, view.did],
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
      if (!view.viewer.blocking) {
        items.push({
          testID: 'profileHeaderDropdownMuteBtn',
          label: view.viewer.muted ? 'Unmute Account' : 'Mute Account',
          onPress: view.viewer.muted
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
      if (!view.viewer.blockingByList) {
        items.push({
          testID: 'profileHeaderDropdownBlockBtn',
          label: view.viewer.blocking ? 'Unblock Account' : 'Block Account',
          onPress: view.viewer.blocking
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
    view.viewer.muted,
    view.viewer.blocking,
    view.viewer.blockingByList,
    onPressShare,
    onPressUnmuteAccount,
    onPressMuteAccount,
    onPressUnblockAccount,
    onPressBlockAccount,
    onPressReportAccount,
    onPressAddRemoveLists,
  ])

  const blockHide = !isMe && (view.viewer.blocking || view.viewer.blockedBy)
  const following = formatCount(view.followsCount)
  const followers = formatCount(view.followersCount)
  const pluralizedFollowers = pluralize(view.followersCount, 'follower')

  return (
    <View style={pal.view}>
      <UserBanner banner={view.banner} moderation={view.moderation.avatar} />
      <View style={styles.content}>
        <View style={[styles.buttonsLine]}>
          {isMe ? (
            <TouchableOpacity
              testID="profileHeaderEditProfileButton"
              onPress={onPressEditProfile}
              style={[styles.btn, styles.mainBtn, pal.btn]}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              accessibilityHint="Opens editor for profile display name, avatar, background image, and description">
              <Text type="button" style={pal.text}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          ) : view.viewer.blocking ? (
            view.viewer.blockingByList ? null : (
              <TouchableOpacity
                testID="unblockBtn"
                onPress={onPressUnblockAccount}
                style={[styles.btn, styles.mainBtn, pal.btn]}
                accessibilityRole="button"
                accessibilityLabel="Unblock"
                accessibilityHint="">
                <Text type="button" style={[pal.text, s.bold]}>
                  Unblock
                </Text>
              </TouchableOpacity>
            )
          ) : !view.viewer.blockedBy ? (
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
                  accessibilityLabel={`Show follows similar to ${view.handle}`}
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

              {store.me.follows.getFollowState(view.did) ===
              FollowState.Following ? (
                <TouchableOpacity
                  testID="unfollowBtn"
                  onPress={onPressToggleFollow}
                  style={[styles.btn, styles.mainBtn, pal.btn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Unfollow ${view.handle}`}
                  accessibilityHint={`Hides posts from ${view.handle} in your feed`}>
                  <FontAwesomeIcon
                    icon="check"
                    style={[pal.text, s.mr5]}
                    size={14}
                  />
                  <Text type="button" style={pal.text}>
                    Following
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  testID="followBtn"
                  onPress={onPressToggleFollow}
                  style={[styles.btn, styles.mainBtn, palInverted.view]}
                  accessibilityRole="button"
                  accessibilityLabel={`Follow ${view.handle}`}
                  accessibilityHint={`Shows posts from ${view.handle} in your feed`}>
                  <FontAwesomeIcon
                    icon="plus"
                    style={[palInverted.text, s.mr5]}
                  />
                  <Text type="button" style={[palInverted.text, s.bold]}>
                    Follow
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
          {dropdownItems?.length ? (
            <NativeDropdown
              testID="profileHeaderDropdownBtn"
              items={dropdownItems}
              accessibilityLabel="More options"
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
              view.displayName || sanitizeHandle(view.handle),
              view.moderation.profile,
            )}
          </Text>
        </View>
        <View style={styles.handleLine}>
          {view.viewer.followedBy && !blockHide ? (
            <View style={[styles.pill, pal.btn, s.mr5]}>
              <Text type="xs" style={[pal.text]}>
                Follows you
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
            {invalidHandle ? '⚠Invalid Handle' : `@${view.handle}`}
          </ThemedText>
        </View>
        {!blockHide && (
          <>
            <View style={styles.metricsLine}>
              <Link
                testID="profileHeaderFollowersButton"
                style={[s.flexRow, s.mr10]}
                href={makeProfileLink(view, 'followers')}
                onPressOut={() => trackPress('Followers')}
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
                href={makeProfileLink(view, 'follows')}
                onPressOut={() => trackPress('Follows')}
                asAnchor
                accessibilityLabel={`${following} following`}
                accessibilityHint={'Opens following list'}>
                <Text type="md" style={[s.bold, pal.text]}>
                  {following}{' '}
                </Text>
                <Text type="md" style={[pal.textLight]}>
                  following
                </Text>
              </Link>
              <Text type="md" style={[s.bold, pal.text]}>
                {formatCount(view.postsCount)}{' '}
                <Text type="md" style={[pal.textLight]}>
                  {pluralize(view.postsCount, 'post')}
                </Text>
              </Text>
            </View>
            {view.description &&
            view.descriptionRichText &&
            !view.moderation.profile.blur ? (
              <RichText
                testID="profileHeaderDescription"
                style={[styles.description, pal.text]}
                numberOfLines={15}
                richText={view.descriptionRichText}
              />
            ) : undefined}
          </>
        )}
        <ProfileHeaderAlerts moderation={view.moderation} />
      </View>

      {!isProfilePreview && (
        <ProfileHeaderSuggestedFollows
          actorDid={view.did}
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
          accessibilityLabel="Back"
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
        accessibilityLabel={`View ${view.handle}'s avatar`}
        accessibilityHint="">
        <View
          style={[pal.view, {borderColor: pal.colors.background}, styles.avi]}>
          <UserAvatar
            size={80}
            avatar={view.avatar}
            moderation={view.moderation.avatar}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
})

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

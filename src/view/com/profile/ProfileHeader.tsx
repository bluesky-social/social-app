import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {useStores} from '../../../state'
import {
  EditProfileModal,
  ReportAccountModal,
  ProfileImageLightbox,
} from '../../../state/models/shell-ui'
import {pluralize} from '../../../lib/strings'
import {s, gradients} from '../../lib/styles'
import {DropdownButton, DropdownItem} from '../util/forms/DropdownButton'
import * as Toast from '../util/Toast'
import {LoadingPlaceholder} from '../util/LoadingPlaceholder'
import {Text} from '../util/text/Text'
import {RichText} from '../util/text/RichText'
import {UserAvatar} from '../util/UserAvatar'
import {UserBanner} from '../util/UserBanner'
import {usePalette} from '../../lib/hooks/usePalette'

export const ProfileHeader = observer(function ProfileHeader({
  view,
  onRefreshAll,
}: {
  view: ProfileViewModel
  onRefreshAll: () => void
}) {
  const pal = usePalette('default')
  const store = useStores()

  const onPressAvi = () => {
    if (view.avatar) {
      store.shell.openLightbox(new ProfileImageLightbox(view))
    }
  }
  const onPressToggleFollow = () => {
    view?.toggleFollowing().then(
      () => {
        Toast.show(
          `${view.myState.follow ? 'Following' : 'No longer following'} ${
            view.displayName || view.handle
          }`,
        )
      },
      err => store.log.error('Failed to toggle follow', err),
    )
  }
  const onPressEditProfile = () => {
    store.shell.openModal(new EditProfileModal(view, onRefreshAll))
  }
  const onPressFollowers = () => {
    store.nav.navigate(`/profile/${view.handle}/followers`)
  }
  const onPressFollows = () => {
    store.nav.navigate(`/profile/${view.handle}/follows`)
  }
  const onPressMuteAccount = async () => {
    try {
      await view.muteAccount()
      Toast.show('Account muted')
    } catch (e: any) {
      store.log.error('Failed to mute account', e)
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }
  const onPressUnmuteAccount = async () => {
    try {
      await view.unmuteAccount()
      Toast.show('Account unmuted')
    } catch (e: any) {
      store.log.error('Failed to unmute account', e)
      Toast.show(`There was an issue! ${e.toString()}`)
    }
  }
  const onPressReportAccount = () => {
    store.shell.openModal(new ReportAccountModal(view.did))
  }

  // loading
  // =
  if (!view || !view.hasLoaded) {
    return (
      <View style={pal.view}>
        <LoadingPlaceholder width="100%" height={120} />
        <View
          style={[pal.view, {borderColor: pal.colors.background}, styles.avi]}>
          <LoadingPlaceholder
            width={80}
            height={80}
            style={{borderRadius: 40}}
          />
        </View>
        <View style={styles.content}>
          <View style={[styles.buttonsLine]}>
            <LoadingPlaceholder
              width={100}
              height={31}
              style={{borderRadius: 50}}
            />
          </View>
          <View style={styles.displayNameLine}>
            <Text type="title-xl" style={[pal.text, {lineHeight: 38}]}>
              {view.displayName || view.handle}
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
  const isMe = store.me.did === view.did
  let dropdownItems: DropdownItem[] | undefined
  if (!isMe) {
    dropdownItems = dropdownItems || []
    dropdownItems.push({
      label: view.myState.muted ? 'Unmute Account' : 'Mute Account',
      onPress: view.myState.muted ? onPressUnmuteAccount : onPressMuteAccount,
    })
    dropdownItems.push({
      label: 'Report Account',
      onPress: onPressReportAccount,
    })
  }
  return (
    <View style={pal.view}>
      <UserBanner handle={view.handle} banner={view.banner} />
      <View style={styles.content}>
        <View style={[styles.buttonsLine]}>
          {isMe ? (
            <TouchableOpacity
              testID="profileHeaderEditProfileButton"
              onPress={onPressEditProfile}
              style={[styles.btn, styles.mainBtn, pal.btn]}>
              <Text type="button" style={pal.text}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {view.myState.follow ? (
                <TouchableOpacity
                  onPress={onPressToggleFollow}
                  style={[styles.btn, styles.mainBtn, pal.btn]}>
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
                  testID="profileHeaderToggleFollowButton"
                  onPress={onPressToggleFollow}>
                  <LinearGradient
                    colors={[
                      gradients.blueLight.start,
                      gradients.blueLight.end,
                    ]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={[styles.btn, styles.gradientBtn]}>
                    <FontAwesomeIcon icon="plus" style={[s.white, s.mr5]} />
                    <Text type="button" style={[s.white, s.bold]}>
                      Follow
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}
          {dropdownItems?.length ? (
            <DropdownButton
              type="bare"
              items={dropdownItems}
              style={[styles.btn, styles.secondaryBtn, pal.btn]}>
              <FontAwesomeIcon icon="ellipsis" style={[pal.text]} />
            </DropdownButton>
          ) : undefined}
        </View>
        <View style={styles.displayNameLine}>
          <Text type="title-xl" style={[pal.text, {lineHeight: 38}]}>
            {view.displayName || view.handle}
          </Text>
        </View>
        <View style={styles.handleLine}>
          <Text style={pal.textLight}>@{view.handle}</Text>
        </View>
        <View style={styles.metricsLine}>
          <TouchableOpacity
            testID="profileHeaderFollowersButton"
            style={[s.flexRow, s.mr10]}
            onPress={onPressFollowers}>
            <Text type="md" style={[s.bold, s.mr2, pal.text]}>
              {view.followersCount}
            </Text>
            <Text type="md" style={[pal.textLight]}>
              {pluralize(view.followersCount, 'follower')}
            </Text>
          </TouchableOpacity>
          {view.isUser ? (
            <TouchableOpacity
              testID="profileHeaderFollowsButton"
              style={[s.flexRow, s.mr10]}
              onPress={onPressFollows}>
              <Text type="md" style={[s.bold, s.mr2, pal.text]}>
                {view.followsCount}
              </Text>
              <Text type="md" style={[pal.textLight]}>
                following
              </Text>
            </TouchableOpacity>
          ) : undefined}
          <View style={[s.flexRow, s.mr10]}>
            <Text type="md" style={[s.bold, s.mr2, pal.text]}>
              {view.postsCount}
            </Text>
            <Text type="md" style={[pal.textLight]}>
              {pluralize(view.postsCount, 'post')}
            </Text>
          </View>
        </View>
        {view.description ? (
          <RichText
            style={[styles.description, pal.text]}
            numberOfLines={15}
            text={view.description}
            entities={view.descriptionEntities}
          />
        ) : undefined}
        {view.myState.muted ? (
          <View style={[styles.detailLine, pal.btn, s.p5]}>
            <FontAwesomeIcon
              icon={['far', 'eye-slash']}
              style={[pal.text, s.mr5]}
            />
            <Text type="md" style={[s.mr2, pal.text]}>
              Account muted.
            </Text>
          </View>
        ) : undefined}
      </View>
      <TouchableWithoutFeedback
        testID="profileHeaderAviButton"
        onPress={onPressAvi}>
        <View
          style={[pal.view, {borderColor: pal.colors.background}, styles.avi]}>
          <UserAvatar
            size={80}
            handle={view.handle}
            displayName={view.displayName}
            avatar={view.avatar}
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
  avi: {
    position: 'absolute',
    top: 80,
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
  gradientBtn: {
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

  displayNameLine: {
    // paddingLeft: 86,
    // marginBottom: 14,
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
})

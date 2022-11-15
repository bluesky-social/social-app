import React, {useMemo} from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AtUri} from '../../../third-party/uri'
import {ProfileViewModel} from '../../../state/models/profile-view'
import {useStores} from '../../../state'
import {
  ConfirmModel,
  EditProfileModel,
  InviteToSceneModel,
} from '../../../state/models/shell-ui'
import {pluralize} from '../../lib/strings'
import {s, colors} from '../../lib/styles'
import {getGradient} from '../../lib/asset-gen'
import {DropdownBtn, DropdownItem} from '../util/DropdownBtn'
import Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {UserBanner} from '../util/UserBanner'
import {UserInfoText} from '../util/UserInfoText'

export const ProfileHeader = observer(function ProfileHeader({
  view,
  onRefreshAll,
}: {
  view: ProfileViewModel
  onRefreshAll: () => void
}) {
  const store = useStores()
  const isMember = useMemo(
    () => view.isScene && view.myState.member,
    [view.myState.member],
  )

  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  const onPressMyAvatar = () => {
    if (store.me.handle) {
      store.nav.navigate(`/profile/${store.me.handle}`)
    }
  }
  const onPressToggleFollow = () => {
    view?.toggleFollowing().then(
      () => {
        Toast.show(
          `${view.myState.follow ? 'Following' : 'No longer following'} ${
            view.displayName || view.handle
          }`,
          {
            duration: Toast.durations.LONG,
            position: Toast.positions.TOP,
          },
        )
      },
      err => console.error('Failed to toggle follow', err),
    )
  }
  const onPressEditProfile = () => {
    store.shell.openModal(new EditProfileModel(view, onRefreshAll))
  }
  const onPressFollowers = () => {
    store.nav.navigate(`/profile/${view.handle}/followers`)
  }
  const onPressFollows = () => {
    store.nav.navigate(`/profile/${view.handle}/follows`)
  }
  const onPressMembers = () => {
    store.nav.navigate(`/profile/${view.handle}/members`)
  }
  const onPressInviteMembers = () => {
    store.shell.openModal(new InviteToSceneModel(view))
  }
  const onPressLeaveScene = () => {
    store.shell.openModal(
      new ConfirmModel(
        'Leave this scene?',
        `You'll be able to come back unless your invite is revoked.`,
        onPressConfirmLeaveScene,
      ),
    )
  }
  const onPressConfirmLeaveScene = async () => {
    if (view.myState.member) {
      await store.api.app.bsky.graph.confirmation.delete({
        did: store.me.did || '',
        rkey: new AtUri(view.myState.member).rkey,
      })
      Toast.show(`Scene left`, {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP,
      })
    }
    onRefreshAll()
  }

  // loading
  // =
  if (!view || (view.isLoading && !view.isRefreshing)) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    )
  }

  // error
  // =
  if (view.hasError) {
    return (
      <View>
        <Text>{view.error}</Text>
      </View>
    )
  }

  // loaded
  // =
  const gradient = getGradient(view.handle)
  const isMe = store.me.did === view.did
  const isCreator = view.isScene && view.creator === store.me.did
  let dropdownItems: DropdownItem[] | undefined
  if (isCreator || isMember) {
    dropdownItems = []
    if (isCreator) {
      dropdownItems.push({
        label: 'Edit Profile',
        onPress: onPressEditProfile,
      })
    }
    if (isMember) {
      dropdownItems.push({
        label: 'Leave Scene...',
        onPress: onPressLeaveScene,
      })
    }
  }
  return (
    <View style={styles.outer}>
      <UserBanner handle={view.handle} />
      {store.nav.tab.canGoBack ? (
        <TouchableOpacity style={styles.backButton} onPress={onPressBack}>
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={styles.backIcon}
          />
        </TouchableOpacity>
      ) : undefined}
      {store.me.did ? (
        <TouchableOpacity style={styles.myAvatar} onPress={onPressMyAvatar}>
          <UserAvatar
            size={30}
            handle={store.me.handle || ''}
            displayName={store.me.displayName}
          />
        </TouchableOpacity>
      ) : undefined}
      <View style={styles.avi}>
        <UserAvatar
          size={80}
          displayName={view.displayName}
          handle={view.handle}
        />
      </View>
      <View style={styles.content}>
        <View style={[styles.buttonsLine]}>
          {isMe ? (
            <TouchableOpacity
              onPress={onPressEditProfile}
              style={[styles.btn, styles.mainBtn]}>
              <Text style={[s.fw400, s.f14]}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              {view.myState.follow ? (
                <TouchableOpacity
                  onPress={onPressToggleFollow}
                  style={[styles.btn, styles.mainBtn]}>
                  <FontAwesomeIcon icon="check" style={[s.mr5]} size={14} />
                  <Text style={[s.fw400, s.f14]}>Following</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={onPressToggleFollow}>
                  <LinearGradient
                    colors={[gradient[1], gradient[0]]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={[styles.btn, styles.gradientBtn]}>
                    <FontAwesomeIcon icon="plus" style={[s.white, s.mr5]} />
                    <Text style={[s.white, s.fw600, s.f16]}>Follow</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}
          {view.isScene &&
          (view.myState.member || view.creator === store.me.did) ? (
            <DropdownBtn
              items={dropdownItems}
              style={[styles.btn, styles.secondaryBtn]}>
              <FontAwesomeIcon icon="ellipsis" style={[s.gray5]} />
            </DropdownBtn>
          ) : undefined}
        </View>
        <View style={styles.displayNameLine}>
          <Text style={styles.displayName}>
            {view.displayName || view.handle}
          </Text>
        </View>
        <View style={styles.handleLine}>
          {view.isScene ? (
            <View style={styles.typeLabelWrapper}>
              <Text style={styles.typeLabel}>Scene</Text>
            </View>
          ) : undefined}
          <Text style={styles.handle}>@{view.handle}</Text>
        </View>
        <View style={styles.metricsLine}>
          <TouchableOpacity
            style={[s.flexRow, s.mr10]}
            onPress={onPressFollowers}>
            <Text style={[s.bold, s.mr2, styles.metricsText]}>
              {view.followersCount}
            </Text>
            <Text style={[s.gray5, styles.metricsText]}>
              {pluralize(view.followersCount, 'follower')}
            </Text>
          </TouchableOpacity>
          {view.isUser ? (
            <TouchableOpacity
              style={[s.flexRow, s.mr10]}
              onPress={onPressFollows}>
              <Text style={[s.bold, s.mr2, styles.metricsText]}>
                {view.followsCount}
              </Text>
              <Text style={[s.gray5, styles.metricsText]}>following</Text>
            </TouchableOpacity>
          ) : undefined}
          {view.isScene ? (
            <TouchableOpacity
              style={[s.flexRow, s.mr10]}
              onPress={onPressMembers}>
              <Text style={[s.bold, s.mr2, styles.metricsText]}>
                {view.membersCount}
              </Text>
              <Text style={[s.gray5, styles.metricsText]}>
                {pluralize(view.membersCount, 'member')}
              </Text>
            </TouchableOpacity>
          ) : undefined}
          <View style={[s.flexRow, s.mr10]}>
            <Text style={[s.bold, s.mr2, styles.metricsText]}>
              {view.postsCount}
            </Text>
            <Text style={[s.gray5, styles.metricsText]}>
              {pluralize(view.postsCount, 'post')}
            </Text>
          </View>
        </View>
        {view.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {view.description}
          </Text>
        ) : undefined}
        {view.isScene && view.creator ? (
          <View style={styles.relationshipsLine}>
            <FontAwesomeIcon icon={['far', 'user']} style={[s.gray5, s.mr5]} />
            <Text style={[s.mr2, s.gray5, s.f15]}>Created by</Text>
            <UserInfoText
              style={[s.blue3, s.f15]}
              did={view.creator}
              prefix="@"
              asLink
            />
          </View>
        ) : undefined}
        {view.isScene && view.myState.member ? (
          <View style={styles.relationshipsLine}>
            <FontAwesomeIcon
              icon={['far', 'circle-check']}
              style={[s.gray5, s.mr5]}
            />
            <Text style={[s.mr2, s.gray5, s.f15]}>You are a member</Text>
          </View>
        ) : undefined}
      </View>
      {view.isScene && view.creator === store.me.did ? (
        <View style={styles.sceneAdminContainer}>
          <TouchableOpacity onPress={onPressInviteMembers}>
            <LinearGradient
              colors={[gradient[1], gradient[0]]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.btn, styles.gradientBtn, styles.sceneAdminBtn]}>
              <FontAwesomeIcon
                icon="user-plus"
                style={[s.mr5, s.white]}
                size={15}
              />
              <Text style={[s.bold, s.f15, s.white]}>Invite Members</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : undefined}
    </View>
  )
})

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.white,
  },
  banner: {
    width: '100%',
    height: 120,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: '#ffff',
    padding: 6,
    borderRadius: 30,
  },
  backIcon: {
    width: 14,
    height: 14,
    color: colors.black,
  },
  myAvatar: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: '#ffff',
    padding: 1,
    borderRadius: 30,
  },
  avi: {
    position: 'absolute',
    top: 80,
    left: 10,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.white,
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
    backgroundColor: colors.gray1,
    marginLeft: 6,
  },

  displayNameLine: {
    // paddingLeft: 86,
    // marginBottom: 14,
  },
  displayName: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  handleLine: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  handle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.gray5,
  },
  typeLabelWrapper: {
    backgroundColor: colors.gray1,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginRight: 5,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.gray5,
  },

  metricsLine: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metricsText: {
    fontSize: 15,
  },

  description: {
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 20.8, // 1.3 of 16px
  },

  relationshipsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  sceneAdminContainer: {
    borderColor: colors.gray1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sceneAdminBtn: {
    paddingVertical: 8,
  },
})

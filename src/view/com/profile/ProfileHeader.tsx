import React from 'react'
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
import {ProfileViewModel} from '../../../state/models/profile-view'
import {useStores} from '../../../state'
import {EditProfileModel} from '../../../state/models/shell'
import {pluralize} from '../../lib/strings'
import {s, colors} from '../../lib/styles'
import {getGradient} from '../../lib/asset-gen'
import Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {UserBanner} from '../util/UserBanner'

export const ProfileHeader = observer(function ProfileHeader({
  view,
}: {
  view: ProfileViewModel
}) {
  const store = useStores()

  const onPressBack = () => {
    store.nav.tab.goBack()
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
    store.shell.openModal(new EditProfileModel(view))
  }
  const onPressMenu = () => {
    // TODO
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
  return (
    <View style={styles.outer}>
      <UserBanner handle={view.handle} />
      {store.nav.tab.canGoBack ? (
        <TouchableOpacity style={styles.backButton} onPress={onPressBack}>
          <FontAwesomeIcon
            size={14}
            icon="angle-left"
            style={styles.backIcon}
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
          <TouchableOpacity
            onPress={onPressMenu}
            style={[styles.btn, styles.secondaryBtn]}>
            <FontAwesomeIcon icon="ellipsis" style={[s.gray5]} />
          </TouchableOpacity>
        </View>
        <View style={styles.displayNameLine}>
          <Text style={styles.displayName}>{view.displayName}</Text>
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
        {view.description && (
          <Text style={[s.mb5, s.f16, s['lh16-1.3']]}>{view.description}</Text>
        )}
        {
          undefined /*<View style={styles.badgesLine}>
          <FontAwesomeIcon icon="shield" style={s.mr5} size={12} />
          <Link href="/" title="Badge TODO">
            <Text style={[s.f12, s.bold]}>
              Employee <Text style={[s.blue3]}>@blueskyweb.xyz</Text>
            </Text>
          </Link>
        </View>*/
        }
      </View>
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

  badgesLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
})

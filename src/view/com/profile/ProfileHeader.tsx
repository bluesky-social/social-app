import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  ActivityIndicator,
  Image,
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
import {s, gradients, colors} from '../../lib/styles'
import {AVIS, BANNER} from '../../lib/assets'
import Toast from '../util/Toast'
import {Link} from '../util/Link'

export const ProfileHeader = observer(function ProfileHeader({
  view,
}: {
  view: ProfileViewModel
}) {
  const store = useStores()

  const onPressToggleFollow = () => {
    view?.toggleFollowing().then(
      () => {
        Toast.show(
          `${view.myState.follow ? 'Following' : 'No longer following'} ${
            view.displayName || view.name
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
    store.nav.navigate(`/profile/${view.name}/followers`)
  }
  const onPressFollows = () => {
    store.nav.navigate(`/profile/${view.name}/follows`)
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
  const isMe = store.me.did === view.did
  return (
    <View style={styles.outer}>
      <Image style={styles.banner} source={BANNER} />
      <Image
        style={styles.avi}
        source={AVIS[view.name] || AVIS['alice.test']}
      />
      <View style={styles.content}>
        <View style={[styles.displayNameLine]}>
          <Text style={styles.displayName}>{view.displayName}</Text>
        </View>
        <View style={styles.badgesLine}>
          <FontAwesomeIcon icon="shield" style={s.mr5} size={12} />
          <Link href="/" title="Badge TODO">
            <Text style={[s.f12, s.bold]}>
              Employee <Text style={[s.blue3]}>@blueskyweb.xyz</Text>
            </Text>
          </Link>
        </View>
        <View style={[styles.buttonsLine]}>
          {isMe ? (
            <TouchableOpacity
              onPress={onPressEditProfile}
              style={[styles.mainBtn, styles.btn]}>
              <Text style={[s.fw400, s.f14]}>Edit Profile</Text>
            </TouchableOpacity>
          ) : view.myState.follow ? (
            <TouchableOpacity
              onPress={onPressToggleFollow}
              style={[styles.mainBtn, styles.btn]}>
              <Text style={[s.fw400, s.f14]}>Following</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onPressToggleFollow}>
              <LinearGradient
                colors={[gradients.primary.start, gradients.primary.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.followBtn]}>
                <FontAwesomeIcon icon="plus" style={[s.white, s.mr5]} />
                <Text style={[s.white, s.fw600, s.f16]}>Follow</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onPressMenu}
            style={[styles.btn, styles.secondaryBtn, s.ml10]}>
            <FontAwesomeIcon icon="ellipsis" style={[s.gray5]} />
          </TouchableOpacity>
        </View>
        <View style={[s.flexRow]}>
          <TouchableOpacity
            style={[s.flexRow, s.mr10]}
            onPress={onPressFollowers}>
            <Text style={[s.bold, s.mr2]}>{view.followersCount}</Text>
            <Text style={s.gray5}>
              {pluralize(view.followersCount, 'follower')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.flexRow, s.mr10]}
            onPress={onPressFollows}>
            <Text style={[s.bold, s.mr2]}>{view.followsCount}</Text>
            <Text style={s.gray5}>following</Text>
          </TouchableOpacity>
          <View style={[s.flexRow, s.mr10]}>
            <Text style={[s.bold, s.mr2]}>{view.postsCount}</Text>
            <Text style={s.gray5}>{pluralize(view.postsCount, 'post')}</Text>
          </View>
        </View>
        {view.description && (
          <Text style={[s.mt10, s.f15, s['lh15-1.3']]}>{view.description}</Text>
        )}
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
  avi: {
    position: 'absolute',
    top: 80,
    left: 10,
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: colors.white,
  },
  content: {
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  displayNameLine: {
    paddingLeft: 86,
    marginBottom: 14,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  badgesLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonsLine: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingLeft: 55,
    paddingRight: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.gray2,
  },
  mainBtn: {
    paddingHorizontal: 40,
  },
  secondaryBtn: {
    paddingHorizontal: 12,
  },
})

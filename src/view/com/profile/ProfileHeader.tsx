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
import {BANNER} from '../../lib/assets'
import Toast from '../util/Toast'
import {UserAvatar} from '../util/UserAvatar'
import {Link} from '../util/Link'

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
        <View style={[styles.displayNameLine]}>
          <Text style={styles.displayName}>{view.displayName}</Text>
        </View>
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
        <View style={[styles.buttonsLine]}>
          {isMe ? (
            <TouchableOpacity
              onPress={onPressEditProfile}
              style={[styles.mainBtn, styles.btn]}>
              <Text style={[s.fw400, s.f14]}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              {view.myState.follow ? (
                <TouchableOpacity
                  onPress={onPressToggleFollow}
                  style={[styles.mainBtn, styles.btn]}>
                  <FontAwesomeIcon icon="check" style={[s.mr5]} size={14} />
                  <Text style={[s.fw400, s.f14]}>Following</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={onPressToggleFollow}
                  style={[styles.mainBtn, styles.btn]}>
                  <FontAwesomeIcon icon="rss" style={[s.mr5]} size={13} />
                  <Text style={[s.fw400, s.f14]}>Follow</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onPressMenu}
                style={[styles.btn, styles.secondaryBtn, s.mr5]}>
                <FontAwesomeIcon icon="user-plus" style={[s.gray5]} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onPressMenu}
                style={[styles.btn, styles.secondaryBtn, s.mr5]}>
                <FontAwesomeIcon icon="note-sticky" style={[s.gray5]} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={onPressMenu}
            style={[styles.btn, styles.secondaryBtn]}>
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
  backButton: {
    position: 'absolute',
    top: 6,
    left: 8,
    backgroundColor: '#000a',
    padding: 6,
    borderRadius: 30,
  },
  backIcon: {
    width: 14,
    height: 14,
    color: colors.white,
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
    borderRadius: 6,
    marginRight: 6,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: colors.gray1,
    marginRight: 6,
  },
  mainBtn: {
    flexDirection: 'row',
  },
  secondaryBtn: {
    flex: 0,
    paddingHorizontal: 14,
    marginRight: 0,
  },
})

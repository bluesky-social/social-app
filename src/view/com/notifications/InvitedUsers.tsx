import React from 'react'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {AppBskyActorDefs} from '@atproto/api'
import {UserAvatar} from '../util/UserAvatar'
import {Text} from '../util/text/Text'
import {Link, TextLink} from '../util/Link'
import {Button} from '../util/forms/Button'
import {FollowButton} from '../profile/FollowButton'
import {CenteredView} from '../util/Views.web'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {makeProfileLink} from 'lib/routes/links'

export const InvitedUsers = observer(function InvitedUsersImpl() {
  const store = useStores()
  return (
    <CenteredView>
      {store.invitedUsers.profiles.map(profile => (
        <InvitedUser key={profile.did} profile={profile} />
      ))}
    </CenteredView>
  )
})

function InvitedUser({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const pal = usePalette('default')
  const store = useStores()

  const onPressDismiss = React.useCallback(() => {
    store.invitedUsers.markSeen(profile.did)
  }, [store, profile])

  return (
    <View
      testID="invitedUser"
      style={[
        styles.layout,
        {
          backgroundColor: pal.colors.unreadNotifBg,
          borderColor: pal.colors.unreadNotifBorder,
        },
      ]}>
      <View style={styles.layoutIcon}>
        <FontAwesomeIcon
          icon="user-plus"
          size={24}
          style={[styles.icon, s.blue3 as FontAwesomeIconStyle]}
        />
      </View>
      <View style={s.flex1}>
        <Link href={makeProfileLink(profile)}>
          <UserAvatar avatar={profile.avatar} size={35} />
        </Link>
        <Text style={[styles.desc, pal.text]}>
          <TextLink
            type="md-bold"
            style={pal.text}
            href={makeProfileLink(profile)}
            text={sanitizeDisplayName(profile.displayName || profile.handle)}
          />{' '}
          joined using your invite code!
        </Text>
        <View style={styles.btns}>
          <FollowButton
            unfollowedType="primary"
            followedType="primary-light"
            did={profile.did}
          />
          <Button
            testID="dismissBtn"
            type="primary-light"
            label="Dismiss"
            onPress={onPressDismiss}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 10,
  },
  layoutIcon: {
    width: 70,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  icon: {
    marginRight: 10,
    marginTop: 4,
  },
  desc: {
    paddingVertical: 6,
  },
  btns: {
    flexDirection: 'row',
    gap: 10,
  },
})

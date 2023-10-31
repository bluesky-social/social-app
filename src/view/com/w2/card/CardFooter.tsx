import React from 'react'
import {ModerationUI} from '@atproto/api'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {View, StyleSheet} from 'react-native'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ProfileViewBasic} from '@waverlyai/atproto-api/dist/client/types/app/bsky/actor/defs'
import {FollowButton} from 'view/com/profile/FollowButton'
import {useStores} from 'state/index'
import {FollowState} from 'state/models/cache/my-follows'
import {FabPickable} from '../web-reader/DraggableFab'

export function CardFooter({
  group,
  newPostCount,
  avatar,
  moderation,
  isWaverlyRec,
}: {
  group: ProfileViewBasic
  newPostCount: number
  avatar?: string | null
  moderation?: ModerationUI
  isWaverlyRec?: boolean
}) {
  const store = useStores()
  const pal = usePalette('default')
  const textStyle = isWaverlyRec ? pal.textInverted : pal.text

  const showFollowButton =
    store.me.follows.getFollowState(group.did) === FollowState.NotFollowing
  return (
    <FabPickable pickID={'group'} zOrder={100}>
      <View style={styles.container}>
        <UserAvatar
          size={24}
          avatar={avatar}
          moderation={moderation}
          type="algo"
        />
        <View style={styles.textContainer}>
          <Text type="xs-bold" style={textStyle}>
            {group?.displayName}
          </Text>
          <Text type="xs" style={textStyle}>
            {newPostCount} new posts since you last visited
          </Text>
        </View>
        {!isWaverlyRec && showFollowButton && (
          <FollowButton
            unfollowedType="primary"
            followedType="primary-light"
            profile={group}
          />
        )}
      </View>
    </FabPickable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  followButtonStyle: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 16,
  },
})

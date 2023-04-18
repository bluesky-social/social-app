import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {AppBskyActorDefs, ComAtprotoLabelDefs} from '@atproto/api'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {FollowButton} from './FollowButton'
import {sanitizeDisplayName} from 'lib/strings/display-names'

export function ProfileCard({
  testID,
  handle,
  displayName,
  avatar,
  description,
  labels,
  isFollowedBy,
  noBg,
  noBorder,
  followers,
  renderButton,
}: {
  testID?: string
  handle: string
  displayName?: string
  avatar?: string
  description?: string
  labels: ComAtprotoLabelDefs.Label[] | undefined
  isFollowedBy?: boolean
  noBg?: boolean
  noBorder?: boolean
  followers?: AppBskyActorDefs.ProfileView[] | undefined
  renderButton?: () => JSX.Element
}) {
  const pal = usePalette('default')
  return (
    <Link
      testID={testID}
      style={[
        styles.outer,
        pal.border,
        noBorder && styles.outerNoBorder,
        !noBg && pal.view,
      ]}
      href={`/profile/${handle}`}
      title={handle}
      asAnchor>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar size={40} avatar={avatar} hasWarning={!!labels?.length} />
        </View>
        <View style={styles.layoutContent}>
          <Text
            type="lg"
            style={[s.bold, pal.text]}
            numberOfLines={1}
            lineHeight={1.2}>
            {sanitizeDisplayName(displayName || handle)}
          </Text>
          <Text type="md" style={[pal.textLight]} numberOfLines={1}>
            @{handle}
          </Text>
          {isFollowedBy && (
            <View style={s.flexRow}>
              <View style={[s.mt5, pal.btn, styles.pill]}>
                <Text type="xs" style={pal.text}>
                  Follows You
                </Text>
              </View>
            </View>
          )}
        </View>
        {renderButton ? (
          <View style={styles.layoutButton}>{renderButton()}</View>
        ) : undefined}
      </View>
      {description ? (
        <View style={styles.details}>
          <Text style={pal.text} numberOfLines={4}>
            {description}
          </Text>
        </View>
      ) : undefined}
      {followers?.length ? (
        <View style={styles.followedBy}>
          <Text
            type="sm"
            style={[styles.followsByDesc, pal.textLight]}
            numberOfLines={2}
            lineHeight={1.2}>
            Followed by{' '}
            {followers.map(f => f.displayName || f.handle).join(', ')}
          </Text>
          {followers.slice(0, 3).map(f => (
            <View key={f.did} style={styles.followedByAviContainer}>
              <View style={[styles.followedByAvi, pal.view]}>
                <UserAvatar avatar={f.avatar} size={32} />
              </View>
            </View>
          ))}
        </View>
      ) : undefined}
    </Link>
  )
}

export const ProfileCardWithFollowBtn = observer(
  ({
    did,
    handle,
    displayName,
    avatar,
    description,
    labels,
    isFollowedBy,
    noBg,
    noBorder,
    followers,
  }: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
    description?: string
    labels: ComAtprotoLabelDefs.Label[] | undefined
    isFollowedBy?: boolean
    noBg?: boolean
    noBorder?: boolean
    followers?: AppBskyActorDefs.ProfileView[] | undefined
  }) => {
    const store = useStores()
    const isMe = store.me.handle === handle

    return (
      <ProfileCard
        handle={handle}
        displayName={displayName}
        avatar={avatar}
        description={description}
        labels={labels}
        isFollowedBy={isFollowedBy}
        noBg={noBg}
        noBorder={noBorder}
        followers={followers}
        renderButton={isMe ? undefined : () => <FollowButton did={did} />}
      />
    )
  },
)

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
    paddingHorizontal: 6,
  },
  outerNoBorder: {
    borderTopWidth: 0,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutAvi: {
    width: 54,
    paddingLeft: 4,
    paddingTop: 8,
    paddingBottom: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  layoutButton: {
    paddingRight: 10,
  },
  details: {
    paddingLeft: 54,
    paddingRight: 10,
    paddingBottom: 10,
  },
  pill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  btn: {
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
    paddingHorizontal: 14,
  },

  followedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 54,
    paddingRight: 20,
    marginBottom: 10,
    marginTop: -6,
  },
  followedByAviContainer: {
    width: 24,
    height: 36,
  },
  followedByAvi: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
  },
  followsByDesc: {
    flex: 1,
    paddingRight: 10,
  },
})

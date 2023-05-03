import React from 'react'
import {StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {AppBskyActorDefs} from '@atproto/api'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {FollowButton} from './FollowButton'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {
  getProfileViewBasicLabelInfo,
  getProfileModeration,
} from 'lib/labeling/helpers'
import {ModerationBehaviorCode} from 'lib/labeling/types'

export const ProfileCard = observer(
  ({
    testID,
    profile,
    noBg,
    noBorder,
    followers,
    overrideModeration,
    renderButton,
  }: {
    testID?: string
    profile: AppBskyActorDefs.ProfileViewBasic
    noBg?: boolean
    noBorder?: boolean
    followers?: AppBskyActorDefs.ProfileView[] | undefined
    overrideModeration?: boolean
    renderButton?: () => JSX.Element
  }) => {
    const store = useStores()
    const pal = usePalette('default')

    const moderation = getProfileModeration(
      store,
      getProfileViewBasicLabelInfo(profile),
    )

    if (
      moderation.list.behavior === ModerationBehaviorCode.Hide &&
      !overrideModeration
    ) {
      return null
    }

    return (
      <Link
        testID={testID}
        style={[
          styles.outer,
          pal.border,
          noBorder && styles.outerNoBorder,
          !noBg && pal.view,
        ]}
        href={`/profile/${profile.handle}`}
        title={profile.handle}
        asAnchor
        anchorNoUnderline>
        <View style={styles.layout}>
          <View style={styles.layoutAvi}>
            <UserAvatar
              size={40}
              avatar={profile.avatar}
              moderation={moderation.avatar}
            />
          </View>
          <View style={styles.layoutContent}>
            <Text
              type="lg"
              style={[s.bold, pal.text]}
              numberOfLines={1}
              lineHeight={1.2}>
              {sanitizeDisplayName(profile.displayName || profile.handle)}
            </Text>
            <Text type="md" style={[pal.textLight]} numberOfLines={1}>
              @{profile.handle}
            </Text>
            {!!profile.viewer?.followedBy && (
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
        {profile.description ? (
          <View style={styles.details}>
            <Text style={pal.text} numberOfLines={4}>
              {profile.description}
            </Text>
          </View>
        ) : undefined}
        <FollowersList followers={followers} />
      </Link>
    )
  },
)

const FollowersList = observer(
  ({followers}: {followers?: AppBskyActorDefs.ProfileView[] | undefined}) => {
    const store = useStores()
    const pal = usePalette('default')
    if (!followers?.length) {
      return null
    }

    const followersWithMods = followers
      .map(f => ({
        f,
        mod: getProfileModeration(store, getProfileViewBasicLabelInfo(f)),
      }))
      .filter(({mod}) => mod.list.behavior !== ModerationBehaviorCode.Hide)

    return (
      <View style={styles.followedBy}>
        <Text
          type="sm"
          style={[styles.followsByDesc, pal.textLight]}
          numberOfLines={2}
          lineHeight={1.2}>
          Followed by{' '}
          {followersWithMods.map(({f}) => f.displayName || f.handle).join(', ')}
        </Text>
        {followersWithMods.slice(0, 3).map(({f, mod}) => (
          <View key={f.did} style={styles.followedByAviContainer}>
            <View style={[styles.followedByAvi, pal.view]}>
              <UserAvatar avatar={f.avatar} size={32} moderation={mod.avatar} />
            </View>
          </View>
        ))}
      </View>
    )
  },
)

export const ProfileCardWithFollowBtn = observer(
  ({
    profile,
    noBg,
    noBorder,
    followers,
  }: {
    profile: AppBskyActorDefs.ProfileViewBasic
    noBg?: boolean
    noBorder?: boolean
    followers?: AppBskyActorDefs.ProfileView[] | undefined
  }) => {
    const store = useStores()
    const isMe = store.me.handle === profile.handle

    return (
      <ProfileCard
        profile={profile}
        noBg={noBg}
        noBorder={noBorder}
        followers={followers}
        renderButton={
          isMe ? undefined : () => <FollowButton did={profile.did} />
        }
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

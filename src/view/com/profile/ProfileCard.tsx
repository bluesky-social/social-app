import * as React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {observer} from 'mobx-react-lite'
import {
  AppBskyActorDefs,
  moderateProfile,
  ProfileModeration,
} from '@atproto/api'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {FollowButton} from './FollowButton'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {
  describeModerationCause,
  getProfileModerationCauses,
  getModerationCauseKey,
} from 'lib/moderation'

export const ProfileCard = observer(function ProfileCardImpl({
  testID,
  profile,
  noBg,
  noBorder,
  followers,
  renderButton,
  style,
}: {
  testID?: string
  profile: AppBskyActorDefs.ProfileViewBasic
  noBg?: boolean
  noBorder?: boolean
  followers?: AppBskyActorDefs.ProfileView[] | undefined
  renderButton?: (profile: AppBskyActorDefs.ProfileViewBasic) => React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const store = useStores()
  const pal = usePalette('default')

  const moderation = moderateProfile(profile, store.preferences.moderationOpts)

  return (
    <Link
      testID={testID}
      style={[
        styles.outer,
        pal.border,
        noBorder && styles.outerNoBorder,
        !noBg && pal.view,
        style,
      ]}
      href={makeProfileLink(profile)}
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
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.profile,
            )}
          </Text>
          <Text type="md" style={[pal.textLight]} numberOfLines={1}>
            {sanitizeHandle(profile.handle, '@')}
          </Text>
          <ProfileCardPills
            followedBy={!!profile.viewer?.followedBy}
            moderation={moderation}
          />
          {!!profile.viewer?.followedBy && <View style={s.flexRow} />}
        </View>
        {renderButton ? (
          <View style={styles.layoutButton}>{renderButton(profile)}</View>
        ) : undefined}
      </View>
      {profile.description ? (
        <View style={styles.details}>
          <Text style={pal.text} numberOfLines={4}>
            {profile.description as string}
          </Text>
        </View>
      ) : null}
      <FollowersList followers={followers} />
    </Link>
  )
})

function ProfileCardPills({
  followedBy,
  moderation,
}: {
  followedBy: boolean
  moderation: ProfileModeration
}) {
  const pal = usePalette('default')

  const causes = getProfileModerationCauses(moderation)
  if (!followedBy && !causes.length) {
    return null
  }

  return (
    <View style={styles.pills}>
      {followedBy && (
        <View style={[s.mt5, pal.btn, styles.pill]}>
          <Text type="xs" style={pal.text}>
            Follows You
          </Text>
        </View>
      )}
      {causes.map(cause => {
        const desc = describeModerationCause(cause, 'account')
        return (
          <View
            style={[s.mt5, pal.btn, styles.pill]}
            key={getModerationCauseKey(cause)}>
            <Text type="xs" style={pal.text}>
              {cause?.type === 'label' ? '⚠' : ''}
              {desc.name}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const FollowersList = observer(function FollowersListImpl({
  followers,
}: {
  followers?: AppBskyActorDefs.ProfileView[] | undefined
}) {
  const store = useStores()
  const pal = usePalette('default')
  if (!followers?.length) {
    return null
  }

  const followersWithMods = followers
    .map(f => ({
      f,
      mod: moderateProfile(f, store.preferences.moderationOpts),
    }))
    .filter(({mod}) => !mod.account.filter)

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
})

export const ProfileCardWithFollowBtn = observer(
  function ProfileCardWithFollowBtnImpl({
    profile,
    noBg,
    noBorder,
    followers,
  }: {
    profile: AppBskyActorDefs.ProfileViewBasic
    noBg?: boolean
    noBorder?: boolean
    followers?: AppBskyActorDefs.ProfileView[] | undefined
  }) {
    const store = useStores()
    const isMe = store.me.did === profile.did

    return (
      <ProfileCard
        profile={profile}
        noBg={noBg}
        noBorder={noBorder}
        followers={followers}
        renderButton={
          isMe ? undefined : () => <FollowButton profile={profile} />
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
    alignSelf: 'baseline',
    width: 54,
    paddingLeft: 4,
    paddingTop: 10,
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
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 6,
    rowGap: 2,
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

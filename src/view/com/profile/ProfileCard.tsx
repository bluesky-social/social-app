import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {
  AppBskyActorDefs,
  moderateProfile,
  ModerationDecision,
} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {useQueryClient} from '@tanstack/react-query'

import {useProfileShadow} from '#/state/cache/profile-shadow'
import {Shadow} from '#/state/cache/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {usePalette} from 'lib/hooks/usePalette'
import {getModerationCauseKey, isJustAMute} from 'lib/moderation'
import {makeProfileLink} from 'lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {s} from 'lib/styles'
import {precacheProfile} from 'state/queries/profile'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {FollowButton} from './FollowButton'
import hairlineWidth = StyleSheet.hairlineWidth
import {atoms as a} from '#/alf'
import * as Pills from '#/components/Pills'

export function ProfileCard({
  testID,
  profile: profileUnshadowed,
  noModFilter,
  noBg,
  noBorder,
  followers,
  renderButton,
  onPress,
  style,
}: {
  testID?: string
  profile: AppBskyActorDefs.ProfileViewBasic
  noModFilter?: boolean
  noBg?: boolean
  noBorder?: boolean
  followers?: AppBskyActorDefs.ProfileView[] | undefined
  renderButton?: (
    profile: Shadow<AppBskyActorDefs.ProfileViewBasic>,
  ) => React.ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const queryClient = useQueryClient()
  const pal = usePalette('default')
  const profile = useProfileShadow(profileUnshadowed)
  const moderationOpts = useModerationOpts()
  const isLabeler = profile?.associated?.labeler

  const onBeforePress = React.useCallback(() => {
    onPress?.()
    precacheProfile(queryClient, profile)
  }, [onPress, profile, queryClient])

  if (!moderationOpts) {
    return null
  }
  const moderation = moderateProfile(profile, moderationOpts)
  const modui = moderation.ui('profileList')
  if (!noModFilter && modui.filter && !isJustAMute(modui)) {
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
        style,
      ]}
      href={makeProfileLink(profile)}
      title={profile.handle}
      asAnchor
      onBeforePress={onBeforePress}
      anchorNoUnderline>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <PreviewableUserAvatar
            size={40}
            profile={profile}
            moderation={moderation.ui('avatar')}
            type={isLabeler ? 'labeler' : 'user'}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text
            type="lg"
            style={[s.bold, pal.text, a.self_start]}
            numberOfLines={1}
            lineHeight={1.2}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.ui('displayName'),
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
        {renderButton && !isLabeler ? (
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
}

export function ProfileCardPills({
  followedBy,
  moderation,
}: {
  followedBy: boolean
  moderation: ModerationDecision
}) {
  const modui = moderation.ui('profileList')
  if (!followedBy && !modui.inform && !modui.alert) {
    return null
  }

  return (
    <Pills.Row style={[a.pt_xs]}>
      {followedBy && <Pills.FollowsYou />}
      {modui.alerts.map(alert => (
        <Pills.Label key={getModerationCauseKey(alert)} cause={alert} />
      ))}
      {modui.informs.map(inform => (
        <Pills.Label key={getModerationCauseKey(inform)} cause={inform} />
      ))}
    </Pills.Row>
  )
}

function FollowersList({
  followers,
}: {
  followers?: AppBskyActorDefs.ProfileView[] | undefined
}) {
  const pal = usePalette('default')
  const moderationOpts = useModerationOpts()

  const followersWithMods = React.useMemo(() => {
    if (!followers || !moderationOpts) {
      return []
    }

    return followers
      .map(f => ({
        f,
        mod: moderateProfile(f, moderationOpts),
      }))
      .filter(({mod}) => !mod.ui('profileList').filter)
  }, [followers, moderationOpts])

  if (!followersWithMods?.length) {
    return null
  }

  return (
    <View style={styles.followedBy}>
      <Text
        type="sm"
        style={[styles.followsByDesc, pal.textLight]}
        numberOfLines={2}
        lineHeight={1.2}>
        <Trans>
          Followed by{' '}
          {followersWithMods.map(({f}) => f.displayName || f.handle).join(', ')}
        </Trans>
      </Text>
      {followersWithMods.slice(0, 3).map(({f, mod}) => (
        <View key={f.did} style={styles.followedByAviContainer}>
          <View style={[styles.followedByAvi, pal.view]}>
            <PreviewableUserAvatar
              size={32}
              profile={f}
              moderation={mod.ui('avatar')}
              type={f.associated?.labeler ? 'labeler' : 'user'}
            />
          </View>
        </View>
      ))}
    </View>
  )
}

export function ProfileCardWithFollowBtn({
  profile,
  noBg,
  noBorder,
  followers,
  onPress,
  logContext = 'ProfileCard',
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  noBg?: boolean
  noBorder?: boolean
  followers?: AppBskyActorDefs.ProfileView[] | undefined
  onPress?: () => void
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
}) {
  const {currentAccount} = useSession()
  const isMe = profile.did === currentAccount?.did

  return (
    <ProfileCard
      profile={profile}
      noBg={noBg}
      noBorder={noBorder}
      followers={followers}
      renderButton={
        isMe
          ? undefined
          : profileShadow => (
              <FollowButton profile={profileShadow} logContext={logContext} />
            )
      }
      onPress={onPress}
    />
  )
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  outerNoBorder: {
    borderTopWidth: 0,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutAvi: {
    alignSelf: 'flex-start',
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
    justifyContent: 'center',
    paddingLeft: 54,
    paddingRight: 10,
    paddingBottom: 10,
  },
  pills: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 6,
    rowGap: 2,
  },
  pill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  btn: {
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
    paddingHorizontal: 14,
  },

  followedBy: {
    flexDirection: 'row',
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

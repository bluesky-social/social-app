import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {
  AppBskyActorDefs,
  moderateProfile,
  ModerationDecision,
} from '@atproto/api'
import {useQueryClient} from '@tanstack/react-query'

import {usePalette} from '#/lib/hooks/usePalette'
import {getModerationCauseKey, isJustAMute} from '#/lib/moderation'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {s} from '#/lib/styles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {Shadow} from '#/state/cache/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {precacheProfile} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {
  KnownFollowers,
  shouldShowKnownFollowers,
} from '#/components/KnownFollowers'
import * as Pills from '#/components/Pills'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {PreviewableUserAvatar} from '../util/UserAvatar'
import {FollowButton} from './FollowButton'

export function ProfileCard({
  testID,
  profile: profileUnshadowed,
  noModFilter,
  noBg,
  noBorder,
  renderButton,
  onPress,
  style,
  showKnownFollowers,
}: {
  testID?: string
  profile: AppBskyActorDefs.ProfileViewBasic
  noModFilter?: boolean
  noBg?: boolean
  noBorder?: boolean
  renderButton?: (
    profile: Shadow<AppBskyActorDefs.ProfileViewBasic>,
  ) => React.ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  showKnownFollowers?: boolean
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

  const knownFollowersVisible =
    showKnownFollowers &&
    shouldShowKnownFollowers(profile.viewer?.knownFollowers) &&
    moderationOpts

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
            emoji
            type="lg"
            style={[s.bold, pal.text, a.self_start]}
            numberOfLines={1}
            lineHeight={1.2}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.ui('displayName'),
            )}
          </Text>
          <Text emoji type="md" style={[pal.textLight]} numberOfLines={1}>
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
      {profile.description || knownFollowersVisible ? (
        <View style={styles.details}>
          {profile.description ? (
            <Text emoji style={pal.text} numberOfLines={4}>
              {profile.description as string}
            </Text>
          ) : null}
          {knownFollowersVisible ? (
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.gap_sm,
                !!profile.description && a.mt_md,
              ]}>
              <KnownFollowers
                minimal
                profile={profile}
                moderationOpts={moderationOpts}
              />
            </View>
          ) : null}
        </View>
      ) : null}
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

export function ProfileCardWithFollowBtn({
  profile,
  noBg,
  noBorder,
  onPress,
  logContext = 'ProfileCard',
  showKnownFollowers,
}: {
  profile: AppBskyActorDefs.ProfileView
  noBg?: boolean
  noBorder?: boolean
  onPress?: () => void
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
  showKnownFollowers?: boolean
}) {
  const {currentAccount} = useSession()
  const isMe = profile.did === currentAccount?.did

  return (
    <ProfileCard
      profile={profile}
      noBg={noBg}
      noBorder={noBorder}
      renderButton={
        isMe
          ? undefined
          : profileShadow => (
              <FollowButton profile={profileShadow} logContext={logContext} />
            )
      }
      onPress={onPress}
      showKnownFollowers={!isMe && showKnownFollowers}
    />
  )
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: StyleSheet.hairlineWidth,
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

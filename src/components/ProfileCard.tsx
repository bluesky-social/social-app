import React from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {
  moderateProfile,
  type ModerationOpts,
  RichText as RichTextApi,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {getModerationCauseKey} from '#/lib/moderation'
import {type LogEvents} from '#/lib/statsig/statsig'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Link as InternalLink, type LinkProps} from '#/components/Link'
import * as Pills from '#/components/Pills'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function Default({
  profile,
  moderationOpts,
  logContext = 'ProfileCard',
  testID,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
  testID?: string
}) {
  return (
    <Link testID={testID} profile={profile}>
      <Card
        profile={profile}
        moderationOpts={moderationOpts}
        logContext={logContext}
      />
    </Link>
  )
}

export function Card({
  profile,
  moderationOpts,
  logContext = 'ProfileCard',
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  logContext?: 'ProfileCard' | 'StarterPackProfilesList'
}) {
  return (
    <Outer>
      <Header>
        <Avatar profile={profile} moderationOpts={moderationOpts} />
        <NameAndHandle profile={profile} moderationOpts={moderationOpts} />
        <FollowButton
          profile={profile}
          moderationOpts={moderationOpts}
          logContext={logContext}
        />
      </Header>

      <Labels profile={profile} moderationOpts={moderationOpts} />

      <Description profile={profile} />
    </Outer>
  )
}

export function Outer({
  children,
}: {
  children: React.ReactNode | React.ReactNode[]
}) {
  return <View style={[a.w_full, a.flex_1, a.gap_xs]}>{children}</View>
}

export function Header({
  children,
}: {
  children: React.ReactNode | React.ReactNode[]
}) {
  return <View style={[a.flex_row, a.align_center, a.gap_sm]}>{children}</View>
}

export function Link({
  profile,
  children,
  style,
  ...rest
}: {
  profile: bsky.profile.AnyProfileView
} & Omit<LinkProps, 'to' | 'label'>) {
  const {_} = useLingui()
  return (
    <InternalLink
      label={_(
        msg`View ${
          profile.displayName || sanitizeHandle(profile.handle)
        }'s profile`,
      )}
      to={{
        screen: 'Profile',
        params: {name: profile.did},
      }}
      style={[a.flex_col, style]}
      {...rest}>
      {children}
    </InternalLink>
  )
}

export function Avatar({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const moderation = moderateProfile(profile, moderationOpts)

  return (
    <PreviewableUserAvatar
      size={40}
      profile={profile}
      moderation={moderation.ui('avatar')}
    />
  )
}

export function AvatarPlaceholder() {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_full,
        t.atoms.bg_contrast_25,
        {
          width: 40,
          height: 40,
        },
      ]}
    />
  )
}

export function NameAndHandle({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )
  const handle = sanitizeHandle(profile.handle, '@')

  return (
    <View style={[a.flex_1]}>
      <Text
        emoji
        style={[a.text_md, a.font_bold, a.leading_snug, a.self_start]}
        numberOfLines={1}>
        {name}
      </Text>
      <Text
        emoji
        style={[a.leading_snug, t.atoms.text_contrast_medium]}
        numberOfLines={1}>
        {handle}
      </Text>
    </View>
  )
}

export function NameAndHandlePlaceholder() {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.gap_xs]}>
      <View
        style={[
          a.rounded_xs,
          t.atoms.bg_contrast_25,
          {
            width: '60%',
            height: 14,
          },
        ]}
      />

      <View
        style={[
          a.rounded_xs,
          t.atoms.bg_contrast_25,
          {
            width: '40%',
            height: 10,
          },
        ]}
      />
    </View>
  )
}

export function Description({
  profile: profileUnshadowed,
  numberOfLines = 3,
}: {
  profile: bsky.profile.AnyProfileView
  numberOfLines?: number
}) {
  const profile = useProfileShadow(profileUnshadowed)
  const rt = React.useMemo(() => {
    if (!('description' in profile)) return
    const rt = new RichTextApi({text: profile.description || ''})
    rt.detectFacetsWithoutResolution()
    return rt
  }, [profile])
  if (!rt) return null
  if (
    profile.viewer &&
    (profile.viewer.blockedBy ||
      profile.viewer.blocking ||
      profile.viewer.blockingByList)
  )
    return null
  return (
    <View style={[a.pt_xs]}>
      <RichText
        value={rt}
        style={[a.leading_snug]}
        numberOfLines={numberOfLines}
        disableLinks
      />
    </View>
  )
}

export function DescriptionPlaceholder({
  numberOfLines = 3,
}: {
  numberOfLines?: number
}) {
  const t = useTheme()
  return (
    <View style={[a.pt_2xs, {gap: 6}]}>
      {Array(numberOfLines)
        .fill(0)
        .map((_, i) => (
          <View
            key={i}
            style={[
              a.rounded_xs,
              a.w_full,
              t.atoms.bg_contrast_25,
              {height: 12, width: i + 1 === numberOfLines ? '60%' : '100%'},
            ]}
          />
        ))}
    </View>
  )
}

export type FollowButtonProps = {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  logContext: LogEvents['profile:follow']['logContext'] &
    LogEvents['profile:unfollow']['logContext']
  colorInverted?: boolean
  onFollow?: () => void
  withIcon?: boolean
} & Partial<ButtonProps>

export function FollowButton(props: FollowButtonProps) {
  const {currentAccount, hasSession} = useSession()
  const isMe = props.profile.did === currentAccount?.did
  return hasSession && !isMe ? <FollowButtonInner {...props} /> : null
}

export function FollowButtonInner({
  profile: profileUnshadowed,
  moderationOpts,
  logContext,
  onPress: onPressProp,
  onFollow,
  colorInverted,
  withIcon = true,
  ...rest
}: FollowButtonProps) {
  const {_} = useLingui()
  const profile = useProfileShadow(profileUnshadowed)
  const moderation = moderateProfile(profile, moderationOpts)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )
  const isRound = Boolean(rest.shape && rest.shape === 'round')

  const onPressFollow = async (e: GestureResponderEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await queueFollow()
      Toast.show(
        _(
          msg`Following ${sanitizeDisplayName(
            profile.displayName || profile.handle,
            moderation.ui('displayName'),
          )}`,
        ),
      )
      onPressProp?.(e)
      onFollow?.()
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
      }
    }
  }

  const onPressUnfollow = async (e: GestureResponderEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await queueUnfollow()
      Toast.show(
        _(
          msg`No longer following ${sanitizeDisplayName(
            profile.displayName || profile.handle,
            moderation.ui('displayName'),
          )}`,
        ),
      )
      onPressProp?.(e)
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
      }
    }
  }

  const unfollowLabel = _(
    msg({
      message: 'Following',
      comment: 'User is following this account, click to unfollow',
    }),
  )
  const followLabel = _(
    msg({
      message: 'Follow',
      comment: 'User is not following this account, click to follow',
    }),
  )

  if (!profile.viewer) return null
  if (
    profile.viewer.blockedBy ||
    profile.viewer.blocking ||
    profile.viewer.blockingByList
  )
    return null

  return (
    <View>
      {profile.viewer.following ? (
        <Button
          label={unfollowLabel}
          size="small"
          variant="solid"
          color="secondary"
          {...rest}
          onPress={onPressUnfollow}>
          {withIcon && (
            <ButtonIcon icon={Check} position={isRound ? undefined : 'left'} />
          )}
          {isRound ? null : <ButtonText>{unfollowLabel}</ButtonText>}
        </Button>
      ) : (
        <Button
          label={followLabel}
          size="small"
          variant="solid"
          color={colorInverted ? 'secondary_inverted' : 'primary'}
          {...rest}
          onPress={onPressFollow}>
          {withIcon && (
            <ButtonIcon icon={Plus} position={isRound ? undefined : 'left'} />
          )}
          {isRound ? null : <ButtonText>{followLabel}</ButtonText>}
        </Button>
      )}
    </View>
  )
}

export function Labels({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const moderation = moderateProfile(profile, moderationOpts)
  const modui = moderation.ui('profileList')
  const followedBy = profile.viewer?.followedBy

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

import {useMemo} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {
  moderateProfile,
  type ModerationOpts,
  RichText as RichTextApi,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useActorStatus} from '#/lib/actor-status'
import {getModerationCauseKey} from '#/lib/moderation'
import {type LogEvents} from '#/lib/statsig/statsig'
import {forceLTR} from '#/lib/strings/bidi'
import {NON_BREAKING_SPACE} from '#/lib/strings/constants'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {PreviewableUserAvatar, UserAvatar} from '#/view/com/util/UserAvatar'
import {
  atoms as a,
  platform,
  type TextStyleProp,
  useTheme,
  type ViewStyleProp,
} from '#/alf'
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
import {useSimpleVerificationState} from '#/components/verification'
import {VerificationCheck} from '#/components/verification/VerificationCheck'
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
  onPress,
  disabledPreview,
  liveOverride,
  size = 40,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  onPress?: () => void
  disabledPreview?: boolean
  liveOverride?: boolean
  size?: number
}) {
  const moderation = moderateProfile(profile, moderationOpts)

  const {isActive: live} = useActorStatus(profile)

  return disabledPreview ? (
    <UserAvatar
      size={size}
      avatar={profile.avatar}
      type={profile.associated?.labeler ? 'labeler' : 'user'}
      moderation={moderation.ui('avatar')}
      live={liveOverride ?? live}
    />
  ) : (
    <PreviewableUserAvatar
      size={size}
      profile={profile}
      moderation={moderation.ui('avatar')}
      onBeforePress={onPress}
      live={liveOverride ?? live}
    />
  )
}

export function AvatarPlaceholder({size = 40}: {size?: number}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_full,
        t.atoms.bg_contrast_25,
        {
          width: size,
          height: size,
        },
      ]}
    />
  )
}

export function NameAndHandle({
  profile,
  moderationOpts,
  inline = false,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  inline?: boolean
}) {
  if (inline) {
    return (
      <InlineNameAndHandle profile={profile} moderationOpts={moderationOpts} />
    )
  } else {
    return (
      <View style={[a.flex_1]}>
        <Name profile={profile} moderationOpts={moderationOpts} />
        <Handle profile={profile} />
      </View>
    )
  }
}

function InlineNameAndHandle({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const verification = useSimpleVerificationState({profile})
  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )
  const handle = sanitizeHandle(profile.handle, '@')
  return (
    <View style={[a.flex_row, a.align_end, a.flex_shrink]}>
      <Text
        emoji
        style={[
          a.font_bold,
          a.leading_tight,
          a.flex_shrink_0,
          {maxWidth: '70%'},
        ]}
        numberOfLines={1}>
        {forceLTR(name)}
      </Text>
      {verification.showBadge && (
        <View
          style={[
            a.pl_2xs,
            a.self_center,
            {marginTop: platform({default: 0, android: -1})},
          ]}>
          <VerificationCheck
            width={platform({android: 13, default: 12})}
            verifier={verification.role === 'verifier'}
          />
        </View>
      )}
      <Text
        emoji
        style={[
          a.leading_tight,
          t.atoms.text_contrast_medium,
          {flexShrink: 10},
        ]}
        numberOfLines={1}>
        {NON_BREAKING_SPACE + handle}
      </Text>
    </View>
  )
}

export function Name({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const moderation = moderateProfile(profile, moderationOpts)
  const name = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )
  const verification = useSimpleVerificationState({profile})
  return (
    <View style={[a.flex_row, a.align_center, a.max_w_full]}>
      <Text
        emoji
        style={[
          a.text_md,
          a.font_bold,
          a.leading_snug,
          a.self_start,
          a.flex_shrink,
        ]}
        numberOfLines={1}>
        {name}
      </Text>
      {verification.showBadge && (
        <View style={[a.pl_xs]}>
          <VerificationCheck
            width={14}
            verifier={verification.role === 'verifier'}
          />
        </View>
      )}
    </View>
  )
}

export function Handle({profile}: {profile: bsky.profile.AnyProfileView}) {
  const t = useTheme()
  const handle = sanitizeHandle(profile.handle, '@')

  return (
    <Text
      emoji
      style={[a.leading_snug, t.atoms.text_contrast_medium]}
      numberOfLines={1}>
      {handle}
    </Text>
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

export function NamePlaceholder({style}: ViewStyleProp) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_xs,
        t.atoms.bg_contrast_25,
        {
          width: '60%',
          height: 14,
        },
        style,
      ]}
    />
  )
}

export function Description({
  profile: profileUnshadowed,
  numberOfLines = 3,
  style,
}: {
  profile: bsky.profile.AnyProfileView
  numberOfLines?: number
} & TextStyleProp) {
  const profile = useProfileShadow(profileUnshadowed)
  const rt = useMemo(() => {
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
        style={[a.leading_snug, style]}
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

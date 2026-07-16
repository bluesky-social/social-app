import {View} from 'react-native'
import {moderateProfile} from '@bsky.app/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'

import {isBlockedOrBlocking} from '#/lib/moderation/blocked-and-muted'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {logger} from '#/logger'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useRemoveFromGroupChat} from '#/state/queries/messages/remove-from-group'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useRequireAuth, useSession} from '#/state/session'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  type ConvoWithDetails,
  type GroupConvoMember,
} from '#/components/dms/util'
import {createStaticClick, SimpleInlineLinkText} from '#/components/Link'
import * as ProfileCard from '#/components/ProfileCard'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {toLex} from '#/types/bsky'
import {MemberMenu} from './MemberMenu'
import {RemoveMemberPrompt} from './prompts'
import {StatusBadge} from './StatusBadge'
import {SubtleHoverWrapper} from './SubtleHoverWrapper'

const outerStyles = [a.px_xl, a.py_sm, a.flex_row, a.align_center, a.gap_sm]

export function Member({
  convo,
  profile: profileUnshadowed,
  status,
  isOwner,
}: {
  convo: ConvoWithDetails
  profile: GroupConvoMember
  status: 'owner' | 'standard'
  isOwner: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const profile = useProfileShadow(profileUnshadowed)
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

  const [queueFollow] = useProfileFollowMutationQueue(profile, 'GroupChat')
  const requireAuth = useRequireAuth()

  const removeMemberPrompt = Prompt.usePromptControl()
  const {mutate: removeMembers} = useRemoveFromGroupChat(convo.view.id, {
    onError: e => {
      logger.error('Failed to remove group chat member', {message: e})
      Toast.show(l`Failed to remove group chat member`, {type: 'error'})
    },
  })

  const isFollowing = !!profile.viewer?.following

  const handleFollow = () => {
    requireAuth(async () => {
      try {
        await queueFollow()
        Toast.show(l`Following ${displayName}`)
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          logger.error('Failed to follow', {message: String(e)})
          Toast.show(l`There was an issue! ${e.toString()}`, {
            type: 'error',
          })
        }
      }
    })
  }

  if (!moderationOpts) {
    return <MemberPlaceholder />
  }

  // TODO(phase4): drop toLex once useProfileShadow emits #/lexicons views
  const moderation = moderateProfile(toLex(profile), moderationOpts)

  const isDeletedAccount = profile.handle === 'missing.invalid'
  const displayName = isDeletedAccount
    ? l`Deleted Account`
    : createSanitizedDisplayName(profile, true, moderation.ui('displayName'))
  const isProfileOwner = profile.did === convo.primaryMember?.did
  const isSelf = currentAccount?.did === profile.did
  let statusBadge: React.ReactNode | null = null
  if (isSelf) {
    if (status === 'owner') {
      statusBadge = <StatusBadge label={l`Admin`} />
    }
  } else {
    statusBadge = (
      <MemberMenu
        convo={convo}
        profile={profile}
        displayName={displayName}
        type={status}
        isOwner={isOwner}
      />
    )
  }

  const joinedReason = profile.kind?.addedBy
    ? // TODO(phase4): drop toLex once addedBy emits #/lexicons views
      l`Added by ${createSanitizedDisplayName(
        profile.kind.addedBy,
        true,
        moderateProfile(toLex(profile.kind.addedBy), moderationOpts).ui(
          'displayName',
        ),
      )}`
    : l`Added by invite link`

  // Surface a prominent remove button to the owner for blocked members.
  const showRemoveButton = isOwner && !isSelf && !!isBlockedOrBlocking(profile)

  return (
    <SubtleHoverWrapper>
      <View style={outerStyles}>
        <ProfileCard.Link profile={profile} style={[a.flex_1]}>
          <ProfileCard.Outer>
            <ProfileCard.Header>
              <ProfileCard.Avatar
                size={48}
                profile={profile}
                moderationOpts={moderationOpts}
              />
              <View style={[a.flex_1]}>
                <ProfileCard.Name
                  profile={profile}
                  moderationOpts={moderationOpts}
                />
                <ProfileCard.Handle
                  profile={profile}
                  textStyle={[a.text_xs, native({top: -1})]}
                />
                {!isProfileOwner && (
                  <Text
                    numberOfLines={1}
                    style={[
                      a.text_xs,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                      web(a.pt_2xs),
                    ]}>
                    {joinedReason}
                  </Text>
                )}
              </View>
            </ProfileCard.Header>
          </ProfileCard.Outer>
        </ProfileCard.Link>
        {showRemoveButton ? (
          <Button
            label={l`Remove ${displayName} from this group chat`}
            size="tiny"
            color="negative_subtle"
            onPress={() => removeMemberPrompt.open()}>
            <ButtonText>
              <Trans>Remove</Trans>
            </ButtonText>
          </Button>
        ) : isSelf || isFollowing || isBlockedOrBlocking(profile) ? null : (
          <SimpleInlineLinkText
            label={l`Follow ${displayName}`}
            {...createStaticClick(handleFollow)}
            style={[a.font_medium]}>
            <Trans>Follow</Trans>
          </SimpleInlineLinkText>
        )}
        {statusBadge}
      </View>
      {/* Mounted outside the showRemoveButton conditional: confirming the
          prompt optimistically drops this row, so gating the prompt on the
          button would unmount it mid-close and race the dismiss animation. */}
      <RemoveMemberPrompt
        control={removeMemberPrompt}
        displayName={displayName}
        onConfirm={() => removeMembers({members: [profile.did]})}
      />
    </SubtleHoverWrapper>
  )
}

export function MemberPlaceholder() {
  return (
    <View style={outerStyles}>
      <ProfileCard.Outer>
        <ProfileCard.Header>
          <ProfileCard.AvatarPlaceholder size={48} />
          <ProfileCard.NameAndHandlePlaceholder />
        </ProfileCard.Header>
      </ProfileCard.Outer>
    </View>
  )
}

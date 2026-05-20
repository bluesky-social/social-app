import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {ChatBskyConvoDefs, moderateProfile} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {type ActiveConvoStates} from '#/state/messages/convo'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {KnownFollowers} from '#/components/KnownFollowers'
import {usePromptControl} from '#/components/Prompt'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'
import {AcceptChatButton, DeleteChatButton, RejectMenu} from './RequestButtons'

export function ChatStatusInfo({convoState}: {convoState: ActiveConvoStates}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const leaveConvoControl = usePromptControl()

  const onAcceptChat = useCallback(() => {
    convoState.markConvoAccepted()
  }, [convoState])

  // either the other person, or the chat owner
  // if we ever allow someone other than the owner to invite people, this will need to change
  const otherUser = convoState.convo.primaryMember

  const lastMessage = ChatBskyConvoDefs.isMessageView(
    convoState.convo.view.lastMessage,
  )
    ? convoState.convo.view.lastMessage
    : null

  if (!moderationOpts) {
    return null
  }

  return (
    <View style={[a.gap_md, a.p_2xl, t.atoms.bg]}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']}
        style={[a.absolute, {top: -16, left: 0, right: 0, height: 16}]}
        pointerEvents="none"
      />
      {otherUser && (
        <InviterHeader profile={otherUser} moderationOpts={moderationOpts} />
      )}
      {otherUser && (
        <KnownFollowers
          profile={otherUser}
          moderationOpts={moderationOpts}
          minimal
          showIfEmpty
        />
      )}
      <View style={[a.flex_row, a.gap_md, a.w_full, otherUser && a.pt_sm]}>
        {otherUser && (
          <RejectMenu
            label={lastMessage ? l`Block or report` : l`Block`}
            icon={true}
            convo={convoState.convo.view}
            profile={otherUser}
            color="negative_subtle"
            size="large"
            currentScreen="conversation"
            style={[a.flex_1]}
          />
        )}
        <DeleteChatButton
          label={l({
            message: 'Leave',
            comment: 'Leave a conversation (reject a chat invitation)',
            context: 'Button',
          })}
          icon={true}
          convo={convoState.convo.view}
          color="secondary"
          size="large"
          currentScreen="conversation"
          style={[a.flex_1]}
          onPress={leaveConvoControl.open}
        />
        <LeaveConvoPrompt
          convoId={convoState.convo.view.id}
          control={leaveConvoControl}
          currentScreen="conversation"
          hasMessages={false}
        />
      </View>
      <View style={[a.w_full, a.flex_row]}>
        <AcceptChatButton
          icon={true}
          onAcceptConvo={onAcceptChat}
          convo={convoState.convo.view}
          color="primary"
          size="large"
          currentScreen="conversation"
          style={[a.flex_1]}
        />
      </View>
    </View>
  )
}

function InviterHeader({
  profile: profileUnshadowed,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: NonNullable<ReturnType<typeof useModerationOpts>>
}) {
  const t = useTheme()
  const profile = useProfileShadow(profileUnshadowed)
  const moderation = useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const displayName = createSanitizedDisplayName(
    profile,
    true,
    moderation.ui('displayName'),
  )

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm]}>
      <PreviewableUserAvatar
        profile={profile}
        size={42}
        moderation={moderation.ui('avatar')}
      />
      <View>
        <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
          <Trans>{displayName} added you</Trans>
        </Text>
        <Text style={[web(a.pt_xs), a.text_sm, t.atoms.text_contrast_high]}>
          {sanitizeHandle(profile.handle, '@')}
        </Text>
      </View>
    </View>
  )
}

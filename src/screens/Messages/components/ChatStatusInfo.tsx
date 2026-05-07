import {useCallback} from 'react'
import {View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {ChatBskyConvoDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {type ActiveConvoStates} from '#/state/messages/convo'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {atoms as a, useTheme} from '#/alf'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {KnownFollowers} from '#/components/KnownFollowers'
import {usePromptControl} from '#/components/Prompt'
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
    <View style={[a.align_center, a.gap_md, a.p_lg, t.atoms.bg]}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']}
        style={[a.absolute, {top: -16, left: 0, right: 0, height: 16}]}
        pointerEvents="none"
      />
      {otherUser && (
        <KnownFollowers
          profile={otherUser}
          moderationOpts={moderationOpts}
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

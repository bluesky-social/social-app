import {Pressable} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {StackActions, useNavigation} from '@react-navigation/native'

import {HITSLOP_10} from '#/lib/constants'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {useLockConvo} from '#/state/queries/messages/lock-conversation'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {type ConvoWithDetails} from '#/components/dms/util'
import {Lock_Stroke2_Corner0_Rounded as LockIcon} from '#/components/icons/Lock'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {LeaveChatPrompt} from '../ConversationSettings/prompts'
import {ChatFooter} from './ChatFooter'

export function ChatLocked({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const leaveChatPrompt = Prompt.usePromptControl()

  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()

  const primaryMember = convo?.primaryMember
  const isOwner = !!primaryMember && primaryMember.did === currentAccount?.did

  const {mutate: lockConvo} = useLockConvo(convo.view.id, {
    onSuccess: () => {
      Toast.show(l({message: 'Group chat unlocked', context: 'toast'}))
    },
    onError: e => {
      logger.error('Failed to unlock group chat', {message: e})
      Toast.show(l`Failed to unlock group chat`, {type: 'error'})
    },
  })

  const {mutate: leaveConvo} = useLeaveConvo(convo.view.id, {
    onSuccess: () => {
      // Settings > Chat > Chat list
      navigation.dispatch(StackActions.pop(2))
    },
    onError: e => {
      logger.error('Failed to leave group chat', {message: e})
      Toast.show(l({message: 'Failed to leave group chat', context: 'toast'}), {
        type: 'error',
      })
    },
  })

  return (
    <ChatFooter
      heading={l`This chat is locked`}
      subheading={l`No one can send messages`}
      icon={LockIcon}>
      {isOwner ? (
        <>
          <Pressable
            accessibilityRole="button"
            hitSlop={HITSLOP_10}
            style={[a.mx_md]}
            onPress={() => lockConvo({lock: false})}>
            <Text
              numberOfLines={1}
              style={[
                a.text_sm,
                a.font_semi_bold,
                a.leading_snug,
                {
                  color: t.palette.negative_500,
                },
              ]}>
              <Trans>Unlock chat</Trans>
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            hitSlop={HITSLOP_10}
            style={[a.mx_md]}
            onPress={leaveChatPrompt.open}>
            <Text
              numberOfLines={1}
              style={[
                a.text_sm,
                a.font_semi_bold,
                a.leading_snug,
                {
                  color: t.palette.negative_500,
                },
              ]}>
              <Trans>Leave chat</Trans>
            </Text>
          </Pressable>
          <LeaveChatPrompt
            control={leaveChatPrompt}
            groupName={convo.details.name}
            onConfirm={leaveConvo}
          />
        </>
      )}
    </ChatFooter>
  )
}

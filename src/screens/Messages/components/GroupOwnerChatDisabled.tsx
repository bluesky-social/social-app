import {Pressable} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {StackActions, useNavigation} from '@react-navigation/native'

import {HITSLOP_10} from '#/lib/constants'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {atoms as a, useTheme} from '#/alf'
import {type ConvoWithDetails} from '#/components/dms/util'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {LeaveChatPrompt} from '../ConversationSettings/prompts'
import {ChatFooter} from './ChatFooter'

export function GroupOwnerChatDisabled({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const leaveChatPrompt = Prompt.usePromptControl()
  const navigation = useNavigation<NavigationProp>()

  const {mutate: leaveConvo} = useLeaveConvo(convo.view.id, {
    onSuccess: () => {
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
      heading={l`This chat is unavailable`}
      subheading={l`The group owner has been suspended`}
      icon={WarningIcon}>
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
    </ChatFooter>
  )
}

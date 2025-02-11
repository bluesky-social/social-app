import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon} from '#/components/icons/ArrowBoxLeft'
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
import {PersonX_Stroke2_Corner0_Rounded as PersonXIcon} from '#/components/icons/Person'
import {KnownFollowers} from '#/components/KnownFollowers'
import * as Menu from '#/components/Menu'
import {ChatListItem} from './ChatListItem'

export function RequestListItem({convo}: {convo: ChatBskyConvoDefs.ConvoView}) {
  const {currentAccount} = useSession()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()

  const otherUser = convo.members.find(
    member => member.did !== currentAccount?.did,
  )

  if (!otherUser || !moderationOpts) {
    return null
  }

  return (
    <ChatListItem convo={convo} showMenu={false}>
      <View style={[a.pt_sm]}>
        <KnownFollowers
          profile={otherUser}
          moderationOpts={moderationOpts}
          minimal
          showIfEmpty
        />
      </View>
      <View style={[a.pt_sm, a.w_full, a.flex_row, a.align_center, a.gap_sm]}>
        <Button
          label={_(msg`Accept chat request`)}
          size="tiny"
          variant="solid"
          color="secondary_inverted"
          style={a.flex_1}>
          <ButtonText>Accept</ButtonText>
        </Button>
        <RejectMenu convo={convo} />
      </View>
    </ChatListItem>
  )
}
function RejectMenu({}: {convo: ChatBskyConvoDefs.ConvoView}) {
  const {_} = useLingui()

  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Reject chat request`)}>
        {({props}) => (
          <Button
            {...props}
            label={props.accessibilityLabel}
            style={[a.flex_1]}
            color="secondary"
            variant="outline"
            size="tiny">
            <ButtonText>Reject</ButtonText>
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.Group>
          <Menu.Item label="Leave conversation" onPress={() => {}}>
            <Menu.ItemText>Leave conversation</Menu.ItemText>
            <Menu.ItemIcon icon={ArrowBoxLeftIcon} />
          </Menu.Item>
          <Menu.Item label="Block account" onPress={() => {}}>
            <Menu.ItemText>Block account</Menu.ItemText>
            <Menu.ItemIcon icon={PersonXIcon} />
          </Menu.Item>
          <Menu.Item label="Report conversation" onPress={() => {}}>
            <Menu.ItemText>Report conversation</Menu.ItemText>
            <Menu.ItemIcon icon={FlagIcon} />
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}

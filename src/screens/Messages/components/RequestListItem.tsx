import {useCallback} from 'react'
import {Keyboard, Pressable} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui as useExample} from '@lingui/react'

import {atoms as a, tokens, useTheme} from '#/alf'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon} from '#/components/icons/ArrowBoxLeft'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
import {PersonX_Stroke2_Corner0_Rounded as PersonXIcon} from '#/components/icons/Person'
import * as Menu from '#/components/Menu'
import {ChatListItem} from './ChatListItem'

export function RequestListItem({convo}: {convo: ChatBskyConvoDefs.ConvoView}) {
  const renderOptions = useCallback(
    () => <RequestMenu convo={convo} />,
    [convo],
  )
  return (
    <ChatListItem
      convo={convo}
      showKnownFollowers
      renderOptions={renderOptions}
    />
  )
}
function RequestMenu({}: {convo: ChatBskyConvoDefs.ConvoView}) {
  const {_} = useExample()
  const t = useTheme()
  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Request options`)}>
        {({props, state}) => (
          <Pressable
            {...props}
            onPress={() => {
              Keyboard.dismiss()
              props.onPress()
            }}
            style={[
              a.p_2xs,
              a.rounded_full,
              (state.hovered || state.pressed) && {opacity: 0.5},
              // {backgroundColor: 'red'},
              // make sure pfp is in the middle
              a.absolute,
              {top: tokens.space.lg, right: tokens.space.md},
            ]}>
            <CircleXIcon size="xl" style={t.atoms.text} />
          </Pressable>
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

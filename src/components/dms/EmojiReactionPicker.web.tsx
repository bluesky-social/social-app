import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {DropdownMenu} from 'radix-ui'

import {useSession} from '#/state/session'
import {atoms as a, flatten, useTheme} from '#/alf'
import * as EmojiPicker from '#/components/EmojiPicker'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotGridIcon} from '#/components/icons/DotGrid'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {hasAlreadyReacted, hasReachedReactionLimit} from './util'

export function EmojiReactionPicker({
  message,
  children,
  onEmojiSelect,
}: {
  message: ChatBskyConvoDefs.MessageView
  children?: EmojiPicker.TriggerProps['children']
  onEmojiSelect: (emoji: string) => void
}) {
  if (!children)
    throw new Error('EmojiReactionPicker requires the children prop on web')

  const {t: l} = useLingui()

  return (
    <EmojiPicker.Root onEmojiSelect={emoji => onEmojiSelect(emoji.native)}>
      <EmojiPicker.Trigger label={l`Add emoji reaction`}>
        {children}
      </EmojiPicker.Trigger>
      <MenuInner message={message} onEmojiSelect={onEmojiSelect} />
    </EmojiPicker.Root>
  )
}

function MenuInner({
  message,
  onEmojiSelect,
}: {
  message: ChatBskyConvoDefs.MessageView
  onEmojiSelect: (emoji: string) => void
}) {
  const t = useTheme()
  const {control} = Menu.useMenuContext()
  const {currentAccount} = useSession()

  const [expanded, setExpanded] = useState(false)

  const [prevOpen, setPrevOpen] = useState(control.isOpen)

  if (control.isOpen !== prevOpen) {
    setPrevOpen(control.isOpen)
    if (!control.isOpen) {
      setExpanded(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    control.close()
    onEmojiSelect(emoji)
  }

  const limitReacted = hasReachedReactionLimit(message, currentAccount?.did)

  return expanded ? (
    <EmojiPicker.Picker keepOpenWhenShiftHeld={false} />
  ) : (
    <Menu.Outer style={[a.rounded_full]}>
      <View style={[a.flex_row, a.gap_xs]}>
        {['👍', '😆', '❤️', '👀', '😢'].map(emoji => {
          const alreadyReacted = hasAlreadyReacted(
            message,
            currentAccount?.did,
            emoji,
          )
          return (
            <DropdownMenu.Item
              key={emoji}
              className={[
                'EmojiReactionPicker__Pressable',
                alreadyReacted && '__selected',
                limitReacted && '__disabled',
              ]
                .filter(Boolean)
                .join(' ')}
              onSelect={() => handleEmojiSelect(emoji)}
              style={flatten([
                a.flex,
                a.flex_col,
                a.rounded_full,
                a.justify_center,
                a.align_center,
                a.transition_transform,
                {
                  width: 34,
                  height: 34,
                },
                alreadyReacted && {
                  backgroundColor: t.atoms.bg_contrast_100.backgroundColor,
                },
              ])}>
              <Text style={[a.text_center, {fontSize: 28}]} emoji>
                {emoji}
              </Text>
            </DropdownMenu.Item>
          )
        })}
        <DropdownMenu.Item
          asChild
          className="EmojiReactionPicker__PickerButton">
          <Pressable
            accessibilityRole="button"
            role="button"
            onPress={() => setExpanded(true)}
            style={flatten([
              a.rounded_full,
              {height: 34, width: 34},
              a.justify_center,
              a.align_center,
            ])}>
            <DotGridIcon size="lg" style={t.atoms.text_contrast_medium} />
          </Pressable>
        </DropdownMenu.Item>
      </View>
    </Menu.Outer>
  )
}

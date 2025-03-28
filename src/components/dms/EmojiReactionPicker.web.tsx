import {useState} from 'react'
import {View} from 'react-native'
import {type ChatBskyConvoDefs} from '@atproto/api'
import EmojiPicker from '@emoji-mart/react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {type Emoji} from '#/view/com/composer/text-input/web/EmojiPicker.web'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a} from '#/alf'
import {useTheme} from '#/alf'
import {DotGrid_Stroke2_Corner0_Rounded as DotGridIcon} from '#/components/icons/DotGrid'
import * as Menu from '#/components/Menu'
import {type TriggerProps} from '#/components/Menu/types'
import {Text} from '#/components/Typography'
import {hasAlreadyReacted, hasReachedReactionLimit} from './util'

export function EmojiReactionPicker({
  message,
  children,
  onEmojiSelect,
}: {
  message: ChatBskyConvoDefs.MessageView
  children?: TriggerProps['children']
  onEmojiSelect: (emoji: string) => void
}) {
  if (!children)
    throw new Error('EmojiReactionPicker requires the children prop on web')

  const {_} = useLingui()

  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Add emoji reaction`)}>{children}</Menu.Trigger>
      <Menu.Outer>
        <MenuInner message={message} onEmojiSelect={onEmojiSelect} />
      </Menu.Outer>
    </Menu.Root>
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

  const handleEmojiPickerResponse = (emoji: Emoji) => {
    handleEmojiSelect(emoji.native)
  }

  const handleEmojiSelect = (emoji: string) => {
    control.close()
    onEmojiSelect(emoji)
  }

  const limitReacted = hasReachedReactionLimit(message, currentAccount?.did)

  return expanded ? (
    <EmojiPicker onEmojiSelect={handleEmojiPickerResponse} autoFocus={true} />
  ) : (
    <View style={[a.flex_row, a.gap_xs]}>
      {['👍', '😆', '❤️', '👀', '😢'].map(emoji => {
        const alreadyReacted = hasAlreadyReacted(
          message,
          currentAccount?.did,
          emoji,
        )
        return (
          <PressableWithHover
            key={emoji}
            onPress={() => handleEmojiSelect(emoji)}
            hoverStyle={{
              backgroundColor: alreadyReacted
                ? t.palette.negative_200
                : !limitReacted
                ? t.palette.primary_300
                : undefined,
            }}
            style={[
              a.rounded_xs,
              {height: 40, width: 40},
              a.justify_center,
              a.align_center,
              alreadyReacted && {backgroundColor: t.palette.primary_100},
            ]}>
            <Text style={[a.text_center, {fontSize: 30}]} emoji>
              {emoji}
            </Text>
          </PressableWithHover>
        )
      })}
      <PressableWithHover
        onPress={() => setExpanded(true)}
        hoverStyle={{backgroundColor: t.palette.primary_100}}
        style={[
          a.rounded_xs,
          {height: 40, width: 40},
          a.justify_center,
          a.align_center,
        ]}>
        <DotGridIcon size="lg" style={t.atoms.text_contrast_medium} />
      </PressableWithHover>
    </View>
  )
}

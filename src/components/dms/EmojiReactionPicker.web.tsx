import {useState} from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import EmojiPicker from '@emoji-mart/react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Emoji} from '#/view/com/composer/text-input/web/EmojiPicker.web'
import {PressableWithHover} from '#/view/com/util/PressableWithHover'
import {atoms as a} from '#/alf'
import {useTheme} from '#/alf'
import {DotGrid_Stroke2_Corner0_Rounded as DotGridIcon} from '#/components/icons/DotGrid'
import * as Menu from '#/components/Menu'
import {TriggerProps} from '#/components/Menu/types'
import {Text} from '#/components/Typography'

export function EmojiReactionPicker({
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  children?: TriggerProps['children']
}) {
  if (!children)
    throw new Error('EmojiReactionPicker requires the children prop on web')

  const {_} = useLingui()

  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Add emoji reaction`)}>{children}</Menu.Trigger>
      <Menu.Outer>
        <MenuInner />
      </Menu.Outer>
    </Menu.Root>
  )
}

function MenuInner() {
  const t = useTheme()
  const {control} = Menu.useMenuContext()

  const [expanded, setExpanded] = useState(false)

  const handleEmojiPickerResponse = (emoji: Emoji) => {
    handleEmojiSelect(emoji.native)
  }

  const handleEmojiSelect = (emoji: string) => {
    control.close()
    window.alert(emoji)
  }

  return expanded ? (
    <EmojiPicker onEmojiSelect={handleEmojiPickerResponse} autoFocus={true} />
  ) : (
    <View style={[a.flex_row, a.gap_xs]}>
      {['👍', '😆', '❤️', '👀', '😢'].map(emoji => (
        <PressableWithHover
          key={emoji}
          onPress={() => handleEmojiSelect(emoji)}
          hoverStyle={{backgroundColor: t.palette.primary_100}}
          style={[
            a.rounded_xs,
            {height: 40, width: 40},
            a.justify_center,
            a.align_center,
          ]}>
          <Text style={[a.text_center, {fontSize: 30}]} emoji>
            {emoji}
          </Text>
        </PressableWithHover>
      ))}
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

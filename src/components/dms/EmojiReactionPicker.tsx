import {useMemo, useState} from 'react'
import {Alert, useWindowDimensions, View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {atoms as a, tokens, useTheme} from '#/alf'
import * as ContextMenu from '#/components/ContextMenu'
import {
  useContextMenuContext,
  useContextMenuMenuContext,
} from '#/components/ContextMenu/context'
import {Text} from '#/components/Typography'

export function EmojiReactionPicker({
  message,
}: {
  message: ChatBskyConvoDefs.MessageView
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const t = useTheme()
  const isFromSelf = message.sender?.did === currentAccount?.did
  const {measurement} = useContextMenuContext()
  const {align} = useContextMenuMenuContext()
  const [layout, setLayout] = useState({width: 0, height: 0})
  const {width: screenWidth} = useWindowDimensions()

  const handleEmojiSelect = (emoji: string) => {
    Alert.alert(emoji)
  }

  const position = useMemo(() => {
    return {
      x: align === 'left' ? 12 : screenWidth - layout.width - 12,
      y: (measurement?.y ?? 0) - tokens.space.xs - layout.height,
      height: layout.height,
      width: layout.width,
    }
  }, [measurement, align, screenWidth, layout])

  return (
    <View
      onLayout={evt => setLayout(evt.nativeEvent.layout)}
      style={[
        a.rounded_full,
        a.absolute,
        {bottom: '100%'},
        isFromSelf ? a.right_0 : a.left_0,
        t.atoms.bg,
        a.flex_row,
        a.shadow_lg,
        a.p_xs,
        a.gap_xs,
        a.mb_xs,
        a.z_20,
      ]}>
      {['👍', '😆', '❤️', '👀', '😢'].map(emoji => (
        <ContextMenu.Item
          position={position}
          label={_(msg`React with ${emoji}`)}
          key={emoji}
          onPress={() => handleEmojiSelect(emoji)}
          unstyled>
          {hovered => (
            <View
              style={[
                a.rounded_full,
                hovered && {backgroundColor: t.palette.primary_500},
                a.p_2xs,
              ]}>
              <Text style={[a.text_center, {fontSize: 32}]} emoji>
                {emoji}
              </Text>
            </View>
          )}
        </ContextMenu.Item>
      ))}
    </View>
  )
}

import {useMemo, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {atoms as a, tokens, useTheme} from '#/alf'
import * as ContextMenu from '#/components/ContextMenu'
import {
  useContextMenuContext,
  useContextMenuMenuContext,
} from '#/components/ContextMenu/context'
import {
  EmojiHeartEyes_Stroke2_Corner0_Rounded as EmojiHeartEyesIcon,
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmileIcon,
} from '#/components/icons/Emoji'
import {type TriggerProps} from '#/components/Menu/types'
import {Text} from '#/components/Typography'
import {EmojiPopup} from './EmojiPopup'
import {hasAlreadyReacted, hasReachedReactionLimit} from './util'

export function EmojiReactionPicker({
  message,
  onEmojiSelect,
}: {
  message: ChatBskyConvoDefs.MessageView
  children?: TriggerProps['children']
  onEmojiSelect: (emoji: string) => void
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const t = useTheme()
  const isFromSelf = message.sender?.did === currentAccount?.did
  const {measurement, close} = useContextMenuContext()
  const {align} = useContextMenuMenuContext()
  const [layout, setLayout] = useState({width: 0, height: 0})
  const {width: screenWidth} = useWindowDimensions()

  // 1 in 100 chance of showing heart eyes icon
  const EmojiIcon = useMemo(() => {
    return Math.random() < 0.01 ? EmojiHeartEyesIcon : EmojiSmileIcon
  }, [])

  const position = useMemo(() => {
    return {
      x: align === 'left' ? 12 : screenWidth - layout.width - 12,
      y: (measurement?.y ?? 0) - tokens.space.xs - layout.height,
      height: layout.height,
      width: layout.width,
    }
  }, [measurement, align, screenWidth, layout])

  const limitReacted = hasReachedReactionLimit(message, currentAccount?.did)

  return (
    <View
      onLayout={evt => setLayout(evt.nativeEvent.layout)}
      style={[
        a.rounded_full,
        a.absolute,
        {bottom: '100%'},
        isFromSelf ? a.right_0 : a.left_0,
        t.scheme === 'light' ? t.atoms.bg : t.atoms.bg_contrast_25,
        a.flex_row,
        a.p_xs,
        a.gap_xs,
        a.mb_xs,
        a.z_20,
        a.border,
        t.atoms.border_contrast_low,
        a.shadow_md,
      ]}>
      {['👍', '😆', '❤️', '👀', '😢'].map(emoji => {
        const alreadyReacted = hasAlreadyReacted(
          message,
          currentAccount?.did,
          emoji,
        )
        return (
          <ContextMenu.Item
            position={position}
            label={_(msg`React with ${emoji}`)}
            key={emoji}
            onPress={() => onEmojiSelect(emoji)}
            unstyled
            disabled={limitReacted ? !alreadyReacted : false}>
            {hovered => (
              <View
                style={[
                  a.rounded_full,
                  hovered
                    ? {
                        backgroundColor: alreadyReacted
                          ? t.palette.negative_100
                          : t.palette.primary_500,
                      }
                    : alreadyReacted
                    ? {backgroundColor: t.palette.primary_200}
                    : t.atoms.bg,
                  {height: 40, width: 40},
                  a.justify_center,
                  a.align_center,
                ]}>
                <Text style={[a.text_center, {fontSize: 30}]} emoji>
                  {emoji}
                </Text>
              </View>
            )}
          </ContextMenu.Item>
        )
      })}
      <EmojiPopup
        onEmojiSelected={emoji => {
          close()
          onEmojiSelect(emoji)
        }}>
        <View
          style={[
            a.rounded_full,
            t.scheme === 'light'
              ? t.atoms.bg_contrast_25
              : t.atoms.bg_contrast_50,
            {height: 40, width: 40},
            a.justify_center,
            a.align_center,
            a.border,
            t.atoms.border_contrast_low,
          ]}>
          <EmojiIcon size="xl" fill={t.palette.contrast_400} />
        </View>
      </EmojiPopup>
    </View>
  )
}

import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Avatar} from '#/screens/Onboarding/StepProfile/index'
import {
  AvatarColor,
  avatarColors,
  emojiItems,
  EmojiName,
  emojiNames,
} from '#/screens/Onboarding/StepProfile/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Text} from '#/components/Typography'

const ACTIVE_BORDER_WIDTH = 3
const ACTIVE_BORDER_STYLES = {
  top: -ACTIVE_BORDER_WIDTH,
  bottom: -ACTIVE_BORDER_WIDTH,
  left: -ACTIVE_BORDER_WIDTH,
  right: -ACTIVE_BORDER_WIDTH,
  opacity: 0.5,
  borderWidth: 3,
}

export function AvatarCreatorItems({
  type,
  avatar,
  setAvatar,
}: {
  type: 'emojis' | 'colors'
  avatar: Avatar
  setAvatar: React.Dispatch<React.SetStateAction<Avatar>>
}) {
  const {_} = useLingui()
  const t = useTheme()
  const isEmojis = type === 'emojis'

  const onSelectEmoji = React.useCallback(
    (emoji: EmojiName) => {
      setAvatar(prev => ({
        ...prev,
        placeholder: emojiItems[emoji],
      }))
    },
    [setAvatar],
  )

  const onSelectColor = React.useCallback(
    (color: AvatarColor) => {
      setAvatar(prev => ({
        ...prev,
        backgroundColor: color,
      }))
    },
    [setAvatar],
  )

  return (
    <View style={[a.w_full]}>
      <Text style={[a.pb_md, t.atoms.text_contrast_medium]}>
        {isEmojis ? (
          <Trans>Select an emoji</Trans>
        ) : (
          <Trans>Select a color</Trans>
        )}
      </Text>

      <View
        style={[
          a.flex_row,
          a.align_start,
          a.justify_start,
          a.flex_wrap,
          a.gap_md,
        ]}>
        {isEmojis
          ? emojiNames.map(emojiName => (
              <Button
                key={emojiName}
                label={_(msg`Select the ${emojiName} emoji as your avatar`)}
                size="small"
                shape="round"
                variant="solid"
                color="secondary"
                onPress={() => onSelectEmoji(emojiName)}>
                <ButtonIcon icon={emojiItems[emojiName].component} />
                {avatar.placeholder.name === emojiName && (
                  <View
                    style={[
                      a.absolute,
                      a.rounded_full,
                      ACTIVE_BORDER_STYLES,
                      {
                        borderColor: avatar.backgroundColor,
                      },
                    ]}
                  />
                )}
              </Button>
            ))
          : avatarColors.map(color => (
              <Button
                key={color}
                label={_(msg`Choose this color as your avatar`)}
                size="small"
                shape="round"
                variant="solid"
                onPress={() => onSelectColor(color)}>
                {ctx => (
                  <>
                    <View
                      style={[
                        a.absolute,
                        a.inset_0,
                        a.rounded_full,
                        {
                          opacity: ctx.hovered || ctx.pressed ? 0.8 : 1,
                          backgroundColor: color,
                        },
                      ]}
                    />

                    {avatar.backgroundColor === color && (
                      <View
                        style={[
                          a.absolute,
                          a.rounded_full,
                          ACTIVE_BORDER_STYLES,
                          {
                            borderColor: color,
                          },
                        ]}
                      />
                    )}
                  </>
                )}
              </Button>
            ))}
      </View>
    </View>
  )
}

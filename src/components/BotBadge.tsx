import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {isBotAccount} from '#/lib/bots'
import {atoms as a, useTheme} from '#/alf'
import {BotAccountAlert} from '#/components/BotAccountAlert'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Bot_Filled as RobotIcon} from '#/components/icons/Bot'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

export function BotBadge({
  profile,
  alwaysShow = false,
  size,
}: {
  profile: bsky.profile.AnyProfileView
  alwaysShow?: boolean
  size: number
}) {
  const t = useTheme()

  if (!isBotAccount(profile) && !alwaysShow) {
    return null
  }

  return (
    <View>
      <RobotIcon width={size} fill={t.atoms.text_contrast_medium.color} />
    </View>
  )
}

export function BotBadgeButton({
  profile,
  size,
}: {
  profile: bsky.profile.AnyProfileView
  size: number
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()
  const control = useDialogControl()

  if (!isBotAccount(profile)) {
    return null
  }

  return (
    <>
      <Button
        label={_(msg`Automated account`)}
        hitSlop={20}
        onPress={evt => {
          evt.preventDefault()
          ax.metric('bot:badge:click', {})
          control.open()
        }}>
        {({hovered}) => (
          <View
            style={[
              a.justify_end,
              a.align_end,
              a.transition_transform,
              {
                width: size,
                height: size,
                transform: [{scale: hovered ? 1.1 : 1}],
              },
            ]}>
            <RobotIcon width={size} fill={t.atoms.text_contrast_medium.color} />
          </View>
        )}
      </Button>
      <BotAccountAlert control={control} profile={profile} />
    </>
  )
}

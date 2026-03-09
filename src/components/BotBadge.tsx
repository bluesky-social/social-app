import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {isBotAccount} from '#/lib/bots'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {BotAccountAlert} from '#/components/BotAccountAlert'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {type Props} from '#/components/icons/common'
import {Robot_Filled_Corner2_Rounded as RobotIcon} from '#/components/icons/Robot'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

export function BotBadge({
  profile,
  alwaysShow = false,
  size,
}: {
  profile: bsky.profile.AnyProfileView
  alwaysShow?: boolean
  size: Props['size']
}) {
  const t = useTheme()

  if (!isBotAccount(profile) && !alwaysShow) {
    return null
  }

  return (
    <View>
      <RobotIcon size={size} fill={t.atoms.text_contrast_medium.color} />
    </View>
  )
}

export function BotBadgeButton({
  profile,
  size,
}: {
  profile: bsky.profile.AnyProfileView
  size: 'lg' | 'md' | 'sm'
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()
  const control = useDialogControl()

  if (!isBotAccount(profile)) {
    return null
  }

  console.log({size})
  let dimensions = 12
  if (size === 'lg') {
    dimensions = gtPhone ? 20 : 18
  } else if (size === 'md') {
    dimensions = 14
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
                width: dimensions,
                height: dimensions,
                transform: [{scale: hovered ? 1.1 : 1}],
              },
            ]}>
            <RobotIcon
              width={dimensions}
              fill={t.atoms.text_contrast_medium.color}
            />
          </View>
        )}
      </Button>
      <BotAccountAlert control={control} profile={profile} />
    </>
  )
}

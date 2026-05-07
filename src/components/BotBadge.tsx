import {View} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {BotAccountAlert} from '#/components/BotAccountAlert'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {Bot_Filled as RobotIcon} from '#/components/icons/Bot'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

export function isBotAccount(profile: {
  did: string
  labels?: ComAtprotoLabelDefs.Label[]
}): boolean {
  return (
    profile.labels?.some(l => l.val === 'bot' && l.src === profile.did) ?? false
  )
}

export function BotBadge({
  profile,
  alwaysShow = false,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  alwaysShow?: boolean
  width: number
}) {
  const t = useTheme()

  if (!isBotAccount(profile) && !alwaysShow) {
    return null
  }

  return (
    <View>
      <RobotIcon width={width} fill={t.atoms.text_contrast_medium.color} />
    </View>
  )
}

export function BotBadgeButton({
  profile,
  width,
}: {
  profile: bsky.profile.AnyProfileView
  width: number
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const control = useDialogControl()

  if (!isBotAccount(profile)) {
    return null
  }

  return (
    <>
      <Button
        label={l`Automated account`}
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
                width: width,
                height: width,
                transform: [{scale: hovered ? 1.1 : 1}],
              },
            ]}>
            <RobotIcon
              width={width}
              fill={t.atoms.text_contrast_medium.color}
            />
          </View>
        )}
      </Button>
      <BotAccountAlert control={control} profile={profile} />
    </>
  )
}
